// middleware/index.js

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash("error", "Please login first");
  return res.redirect("/login");
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "admin") return next();
  req.flash("error", "Admin access required");
  return res.redirect("/login");
};

module.exports = { isLoggedIn, isAdmin };
