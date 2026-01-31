const express = require("express");
const router = express.Router();

const multer = require("multer");
const { storage, cloudinary } = require("../cloudConfig");
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

    const allListings = await Listing.find(query).sort({ createdAt: -1 });
    res.render("listings/index.ejs", { allListings, search });
  })
);

// ===============================
// NEW LISTING FORM
// ===============================
router.get("/new", isAdmin, (req, res) => {
  res.render("listings/new.ejs");
});

// ===============================
// CREATE LISTING
// ===============================
router.post(
  "/",
  isAdmin,
  upload.single("listing[image]"),
  wrapAsync(async (req, res) => {
    const listing = new Listing(req.body.listing);

    if (req.file) {
      listing.images = [
        {
          url: req.file.path,
          filename: req.file.filename,
        },
      ];
    }

    await listing.save();
    req.flash("success", "New package added");
    res.redirect("/listings");
  })
);

// ===============================
// EDIT LISTING FORM
// ===============================
router.get(
  "/:id/edit",
  isAdmin,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
  })
);

// ===============================
// UPDATE LISTING
// ===============================
router.put(
  "/:id",
  isAdmin,
  upload.array("listing[image]", 5),
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    Object.assign(listing, req.body.listing);

    if (req.files && req.files.length > 0) {
      const imgs = req.files.map(file => ({
        url: file.path,
        filename: file.filename,
      }));
      listing.images.push(...imgs);
    }

    if (req.body.deleteImages) {
      const deleteImages = Array.isArray(req.body.deleteImages)
        ? req.body.deleteImages
        : [req.body.deleteImages];

      for (let filename of deleteImages) {
        await cloudinary.uploader.destroy(filename);
      }

      listing.images = listing.images.filter(
        img => !deleteImages.includes(img.filename)
      );
    }

    await listing.save();
    req.flash("success", "Listing Updated Successfully");
    res.redirect(`/listings/${listing._id}`);
  })
);

// ===============================
// DELETE LISTING
// ===============================
router.delete(
  "/:id",
  isAdmin,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    for (let img of listing.images) {
      await cloudinary.uploader.destroy(img.filename);
    }

    await listing.deleteOne();
    req.flash("success", "Listing Deleted Successfully");
    res.redirect("/listings");
  })
);

// ===============================
// SHOW SINGLE LISTING
// ===============================
router.get(
  "/:id",
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
  })
);

module.exports = router;
