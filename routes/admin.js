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


module.exports = router;
