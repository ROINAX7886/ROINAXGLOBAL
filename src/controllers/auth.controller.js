import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js'; // Use the shared singleton instance

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const name = req.body.name || req.body.fullName;
    const { email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: passwordHash
      }
    });

    req.session.userId = newUser.id;
    req.session.user = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session save error on signup:', err);
      }
      return res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        redirectUrl: '/'
      });
    });
  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during account creation.'
    });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    // Ensure session is saved to store before returning response
    req.session.save((err) => {
      if (err) {
        console.error('Session save error on login:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to establish user session.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Signed in successfully.',
        redirectUrl: '/'
      });
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
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

// PUT /api/auth/update-profile
export const updateProfile = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.session.userId },
      data: { name: name.trim() }
    });

    if (req.session.user) {
      req.session.user.name = updatedUser.name;
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.'
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating profile.'
    });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      req.session.destroy();
      res.clearCookie('roinax_sid');
      return res.status(200).json({
        success: true,
        authenticated: false,
        user: null
      });
    }

    return res.status(200).json({
      success: true,
      authenticated: true,
      user
    });
  } catch (error) {
    console.error('Get Current User Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user data.'
    });
  }
};