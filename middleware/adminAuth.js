module.exports = (req, res, next) => {
  // Check if user is authenticated AND admin
  if (req.session && req.session.isAdmin && req.session.userId) {
    // Verify session is not expired (additional check)
    if (req.session.loginTime && Date.now() - req.session.loginTime > 24 * 60 * 60 * 1000) {
      // Session expired (24 hours)
      req.session.destroy();
      return res.redirect("/admin/login?expired=true");
    }
    return next();
  }
  res.redirect("/admin/login");
};
