export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    if (req.accepts('html')) {
      return res.redirect('/login.html');
    }
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  next();
};