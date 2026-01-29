const express = require("express");
const router = express.Router();

const Listing = require("../models/listing");
const Booking = require("../models/booking");
const { isAdmin } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");

// =====================
// 👑 ADMIN DASHBOARD
// =====================
router.get(
  "/admin",
  isAdmin,
  wrapAsync(async (req, res) => {
    const totalListings = await Listing.countDocuments({});
    const totalBookings = await Booking.countDocuments({});
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const confirmedBookings = await Booking.countDocuments({
      status: "confirmed",
    });

    res.render("admin/dashboard.ejs", {
      totalListings,
      totalBookings,
      pendingBookings,
      confirmedBookings,
    });
  })
);


// =====================
// 👑 ADMIN REGISTER (SECRET KEY ONLY)
// =====================

// SHOW ADMIN REGISTER FORM
router.get("/admin/register", (req, res) => {
  res.render("admin/register.ejs");
});

// HANDLE ADMIN REGISTER
router.post(
  "/admin/register",
  wrapAsync(async (req, res) => {
    const { username, email, password, adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
      req.flash("error", "Invalid admin secret ❌");
      return res.redirect("/admin/register");
    }

    const admin = new User({
      username,
      email,
      role: "admin",
    });

    await User.register(admin, password);

    req.flash("success", "Admin account created ");
    res.redirect("/login");
  })
);




module.exports = router;
