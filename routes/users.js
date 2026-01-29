const express = require("express");
const router = express.Router();

const passport = require("passport")
const Booking = require("../models/booking");

const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");

// =====================
// 👤 USER DASHBOARD
// =====================
router.get(
  "/user/dashboard",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const totalBookings = await Booking.countDocuments({
      user: req.user._id,
    });

    const pendingBookings = await Booking.countDocuments({
      user: req.user._id,
      status: "pending",
    });

    const confirmedBookings = await Booking.countDocuments({
      user: req.user._id,
      status: "confirmed",
    });

    const cancelRequested = await Booking.countDocuments({
      user: req.user._id,
      status: "cancel_requested",
    });

    res.render("users/dashboard.ejs", {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelRequested,
    });
  })
);

// =====================
// 🔐 SINGLE LOGIN (ADMIN + USER)
// =====================

// SHOW LOGIN FORM
router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

// HANDLE LOGIN
router.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    if (req.user.role === "admin") {
      req.flash("success", "Welcome Admin ");
      return res.redirect("/admin");
    }

    req.flash("success", "Welcome back ");
    res.redirect("/user/dashboard");
  }
);

// =====================
// 🚪 LOGOUT
// =====================
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.flash("success", "Logged out ");
    res.redirect("/listings");
  });
});

// =====================
// 👤 USER REGISTER
// =====================

// SHOW REGISTER FORM
router.get("/register", (req, res) => {
  res.render("users/register.ejs");
});

// HANDLE REGISTER
router.post(
  "/register",
  wrapAsync(async (req, res, next) => {
    const { username, email, password } = req.body;

    const newUser = new User({
      username,
      email,
      role: "user",
    });

    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Registered Successfully ");
      res.redirect("/user/dashboard");
    });
  })
);


module.exports = router;
