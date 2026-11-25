import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../lib/prisma.js';
import { sendOtpEmail } from '../lib/mailer.js';
import { uploadToCloudinary, extractPublicId, deleteFromCloudinary } from '../lib/cloudinary.js';

// Helper: Dynamically get OAuth2Client configured for User Login/Signup
const getGoogleClient = (req) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const dynamicCallbackUrl = `${protocol}://${host}/api/auth/google/callback`;

  // Prefer dedicated GOOGLE_OAUTH_CALLBACK_URL, fallback to dynamic request URL
  const callbackUrl = process.env.GOOGLE_OAUTH_CALLBACK_URL || dynamicCallbackUrl;

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  const client = new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri: callbackUrl,
  });

  return { client, callbackUrl, clientId };
};

// Helper: 6-Digit Numeric OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper: Merge guest session items into Supabase user cart
const migrateGuestCart = async (userId, guestCart) => {
  if (!Array.isArray(guestCart) || guestCart.length === 0) return;

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  for (const item of guestCart) {
    const devId = item.deviceId || item.id;
    if (!devId) continue;

    await prisma.cartItem.upsert({
      where: {
        cartId_deviceId: {
          cartId: cart.id,
          deviceId: String(devId),
        },
      },
      update: {
        quantity: { increment: Number(item.quantity || item.qty || 1) },
      },
      create: {
        cartId: cart.id,
        deviceId: String(devId),
        name: String(item.name || 'Hardware Device'),
        price: Number(item.price || 0),
        quantity: Number(item.quantity || item.qty || 1),
      },
    });
  }
};

// ==========================================
// 1. STANDARD CREDENTIALS AUTHENTICATION
// ==========================================

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Merge unauthenticated session cart into Supabase
    const guestItems = req.session.cart || [];
    await migrateGuestCart(user.id, guestItems);
    req.session.cart = [];

    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || null,
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session save error on login:', err);
        return res.status(500).json({ success: false, message: 'Failed to establish session.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Signed in successfully.',
        redirectUrl: '/',
      });
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

// POST /api/auth/logout
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.redirect('/profile');
    }

    res.clearCookie('roinax_sid', { path: '/' });

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(200).json({ success: true, redirectUrl: '/login' });
    }

    return res.redirect('/login');
  });
};

// ==========================================
// 2. EMAIL OTP REGISTRATION FLOW
// ==========================================

// POST /api/auth/send-signup-otp
export const sendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otp.deleteMany({ where: { email: normalizedEmail, type: 'SIGNUP' } });
    await prisma.otp.create({
      data: { email: normalizedEmail, code, type: 'SIGNUP', expiresAt },
    });

    await sendOtpEmail(normalizedEmail, code, 'Account Registration');
    return res.status(200).json({ success: true, message: 'Verification OTP sent to your email.' });
  } catch (error) {
    console.error('Send Signup OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to dispatch verification code.' });
  }
};

// POST /api/auth/verify-signup-otp
export const verifySignupOtp = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;
    if (!name || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: 'All registration fields are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await prisma.otp.findFirst({
      where: {
        email: normalizedEmail,
        code: String(otp).trim(),
        type: 'SIGNUP',
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    await prisma.otp.deleteMany({ where: { email: normalizedEmail, type: 'SIGNUP' } });

    // Migrate session items to new user account
    const guestItems = req.session.cart || [];
    await migrateGuestCart(user.id, guestItems);
    req.session.cart = [];

    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: null,
    };

    req.session.save(() => {
      res.status(201).json({
        success: true,
        message: 'Account registered and verified successfully.',
        redirectUrl: '/',
      });
    });
  } catch (error) {
    console.error('Verify Signup Error:', error);
    return res.status(500).json({ success: false, message: 'Account creation failed.' });
  }
};

// ==========================================
// 3. OTP FORGOT PASSWORD & RESET FLOW
// ==========================================

// POST /api/auth/forgot-password-otp
export const sendForgotOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(200).json({ success: true, message: 'If registered, an OTP has been dispatched.' });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otp.deleteMany({ where: { email: normalizedEmail, type: 'FORGOT_PASSWORD' } });
    await prisma.otp.create({
      data: { email: normalizedEmail, code, type: 'FORGOT_PASSWORD', expiresAt },
    });

    await sendOtpEmail(normalizedEmail, code, 'Password Reset');
    return res.status(200).json({ success: true, message: 'Password reset code dispatched to email.' });
  } catch (error) {
    console.error('Send Forgot OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to dispatch reset code.' });
  }
};

// POST /api/auth/reset-password
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Valid parameters required (min 6 chars).' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await prisma.otp.findFirst({
      where: {
        email: normalizedEmail,
        code: String(otp).trim(),
        type: 'FORGOT_PASSWORD',
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    });

    await prisma.otp.deleteMany({ where: { email: normalizedEmail, type: 'FORGOT_PASSWORD' } });
    return res.status(200).json({ success: true, message: 'Password updated. Please sign in.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Password reset failed.' });
  }
};

// ==========================================
// 4. IN-APP PASSWORD CHANGE (AUTHENTICATED)
// ==========================================

// POST /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized session.' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Valid passwords required (min 6 chars).' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ success: false, message: 'Account authenticated via Google OAuth.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating password.' });
  }
};

// ==========================================
// 5. GOOGLE OAUTH PLATFORM INTEGRATION
// ==========================================

// GET /api/auth/google
export const googleAuthRedirect = (req, res) => {
  const mode = req.query.mode === 'signup' ? 'signup' : 'login';
  const { client, callbackUrl } = getGoogleClient(req);

  console.log('[OAUTH_REDIRECT] Initiated for mode:', mode);
  console.log('[OAUTH_REDIRECT] Computed callbackUrl:', callbackUrl);

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'select_account',
    response_type: 'code',
    redirect_uri: callbackUrl,
    state: JSON.stringify({ mode }),
  });

  console.log('[OAUTH_REDIRECT] Redirecting browser to:', url);

  return res.redirect(url);
};

// GET /api/auth/google/callback
export const googleAuthCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.redirect('/login?error=oauth_missing_code');

    let mode = 'login';
    try {
      if (state) {
        const parsedState = JSON.parse(state);
        mode = parsedState.mode || 'login';
      }
    } catch {
      mode = 'login';
    }

    const { client, callbackUrl, clientId } = getGoogleClient(req);

    const { tokens } = await client.getToken({
      code,
      redirect_uri: callbackUrl,
    });
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    const normalizedEmail = email.toLowerCase().trim();

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email: normalizedEmail }],
      },
    });

    // If clicking "Sign In" but no account exists, redirect to sign up
    if (!user && mode === 'login') {
      return res.redirect('/signup?error=account_not_found');
    }

    // If clicking "Sign Up" and user doesn't exist, create it
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: name || 'Google Enterprise User',
          email: normalizedEmail,
          googleId,
          avatarUrl: picture || null,
        },
      });
    } else {
      const updates = {};
      if (!user.googleId) updates.googleId = googleId;
      if (!user.avatarUrl && picture) updates.avatarUrl = picture;

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    }

    // Merge session cart to Supabase user account
    const guestItems = req.session.cart || [];
    await migrateGuestCart(user.id, guestItems);
    req.session.cart = [];

    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || null,
    };

    req.session.save(() => {
      const target = req.session.returnTo || '/';
      delete req.session.returnTo;
      res.redirect(target);
    });
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    res.redirect('/login?error=oauth_failed');
  }
};

// ==========================================
// 6. SESSION PROFILE & AVATAR UPDATES
// ==========================================

// PUT /api/auth/update-profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const name = (req.body.name || req.body.fullName)?.trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    // 1. Fetch current avatar to allow replacing/destroying previous upload
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    let avatarUrl = undefined;

    // 2. Process image buffer directly with Cloudinary
    if (req.file) {
      if (existingUser?.avatarUrl) {
        const oldPublicId = extractPublicId(existingUser.avatarUrl);
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId);
        }
      }

      const uploadResult = await uploadToCloudinary(req.file.buffer, 'roinax_avatars');
      avatarUrl = uploadResult.secure_url;
    }

    // 3. Persist name & optional avatar to Supabase
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        ...(avatarUrl && { avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    // 4. Synchronize session cache
    if (req.session.user) {
      req.session.user.name = updatedUser.name;
      if (updatedUser.avatarUrl) {
        req.session.user.avatarUrl = updatedUser.avatarUrl;
      }
    }

    req.session.save((err) => {
      if (err) {
        console.error('Session update error:', err);
      }
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        user: updatedUser,
      });
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 2MB.' });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile.',
    });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      req.session.destroy();
      res.clearCookie('roinax_sid');
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null,
      });
    }

    return res.status(200).json({
      success: true,
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking session.',
    });
  }
};