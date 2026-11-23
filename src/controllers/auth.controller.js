import { AuthService } from '../services/auth.service.js';

export class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required. Password must be at least 6 characters.',
        });
      }

      const user = await AuthService.registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;

      return res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.',
        });
      }

      const user = await AuthService.authenticateUser({
        email: email.trim().toLowerCase(),
        password,
      });

      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Logout failed.' });
      }
      res.clearCookie('roinax_sid');
      return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    });
  }

  static me(req, res) {
    return res.status(200).json({
      success: true,
      data: {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
      },
    });
  }
}