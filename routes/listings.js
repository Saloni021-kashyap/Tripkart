const express = require("express");
const router = express.Router();

const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isAdmin } = require("../middleware");


// ===============================
// SHOW ALL LISTINGS
// ===============================
router.get(
  "/",
  wrapAsync(async (req, res) => {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { destination: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ],
      };
    }

    const allListings = await Listing.find(query).maxTimeMS(20000);
    res.render("listings/index.ejs", { allListings, search });
  })
);

// NEW LISTING FORM
router.get("/new", isAdmin, (req, res) => {
  res.render("listings/new.ejs");
});

// ===============================
// CREATE LISTING (Cloudinary)
// ===============================
router.post(
  "/",
  isAdmin,
  upload.single("listing[image]"),
  wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);

    // 🔥 CLOUDINARY URL SAVE
    if (req.file) {
      newListing.images = [
        {
          url: req.file.path,        // Cloudinary URL
          filename: req.file.filename
        }
      ];
    }

    await newListing.save();
    req.flash("success", "New Listing Added");
    res.redirect("/listings");
  })
);



// EDIT LISTING FORM
router.get(
  "/:id/edit",
  isAdmin,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found ");
      return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
  })
);

// UPDATE LISTING
router.put(
  "/:id",
  isAdmin,
  upload.array("listing[image]", 5),
  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findByIdAndUpdate(id, req.body.listing, {
      new: true,
    });

    if (req.files && req.files.length > 0) {
      const imgs = req.files.map((file) => ({
        url: file.path,
        filename: file.filename,
      }));
      listing.images.push(...imgs);
      await listing.save();
    }

    req.flash("success", "Listing Updated ");
    res.redirect(`/listings/${id}`);
  })
);

// DELETE LISTING ✅ FIXED
router.delete(
  "/:id",
  isAdmin,
  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const deleted = await Listing.findByIdAndDelete(id);
    if (!deleted) {
      req.flash("error", "Listing not found ");
      return res.redirect("/listings");
    }

    req.flash("success", "Listing deleted successfully ");
    res.redirect("/listings");
  })
);

// SHOW SINGLE LISTING (ALWAYS LAST)
router.get(
  "/:id",
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found ");
      return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
  })
);

module.exports = router;
