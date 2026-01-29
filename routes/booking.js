const express = require("express");
const router = express.Router();

const Booking = require("../models/booking");
const Listing = require("../models/listing");

const { isLoggedIn, isAdmin } = require("../middleware"); // ✅ THIS LINE
const wrapAsync = require("../utils/wrapAsync");


// ===============================
// CREATE BOOKING (USER)
// ===============================
router.post(
  "/listings/:id/bookings",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found ");
      return res.redirect("/listings");
    }

    const booking = new Booking(req.body.booking);
    booking.listing = listing._id;
    booking.user = req.user._id;

    await booking.save();

    req.flash("success", "Booking request submitted ");
    res.redirect("/my-bookings");
  })
);


// ===============================
//  USER: MY BOOKINGS
// ===============================
router.get(
  "/my-bookings",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const myBookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 });

    res.render("bookings/myBookings.ejs", { myBookings });
  })
);

// ===============================
//  ADMIN: ALL BOOKINGS
// ===============================
router.get(
  "/bookings",
  isAdmin,
  wrapAsync(async (req, res) => {
    const allBookings = await Booking.find({})
      .populate("listing")
      .populate("user")
      .sort({ createdAt: -1 });

    res.render("bookings/index.ejs", { allBookings });
  })
);


// ===============================
//  ADMIN: CONFIRM BOOKING
// ===============================
router.put(
  "/bookings/:id/confirm",
  isAdmin,
  wrapAsync(async (req, res) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      req.flash("error", "Booking not found ");
      return res.redirect("/bookings");
    }

    booking.status = "confirmed";
    await booking.save();

    req.flash("success", "Booking Confirmed ");
    res.redirect("/bookings");
  })
);


// ===============================
//  ADMIN: CANCEL BOOKING
// ===============================
router.put(
  "/bookings/:id/cancel",
  isAdmin,
  wrapAsync(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      req.flash("error", "Booking not found ");
      return res.redirect("/bookings");
    }

    // Restore seats
    const listing = await Listing.findById(booking.listing);
    if (listing) {
      listing.availableSeats += booking.persons;
      await listing.save();
    }

    booking.status = "cancelled";
    await booking.save();

    req.flash("success", "Booking Cancelled  Seats Restored");
    res.redirect("/bookings");
  })
);

module.exports = router;
