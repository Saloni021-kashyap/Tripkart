require("dotenv").config();

const express = require("express");
const app = express();

const mongoose = require("mongoose");
const path = require("path");

const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const session = require("express-session");
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const Booking = require("./models/booking.js");

const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });


// =====================
// ✅ MIDDLEWARES
// =====================
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");

const sessionOptions = {
  secret: process.env.SESSION_SECRET || "mytravelsecret",
  resave: false,
  saveUninitialized: true,
};

app.use(session(sessionOptions));
app.use(flash());

// =====================
// ✅ PASSPORT SETUP
// =====================
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// =====================
// ✅ GLOBAL LOCALS
// =====================
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user || null;
  res.locals.isAdmin = req.user && req.user.role === "admin";
  next();
});

// =====================
// ✅ DB CONNECTION
// =====================

const dbUrl = process.env.ATLASTDB_URL;

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("MongoDB Atlas connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// =====================
// ✅ AUTH MIDDLEWARES
// =====================
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash("error", "Please login first ");
  return res.redirect("/login");
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "admin") return next();
  req.flash("error", "Admin access required ");
  return res.redirect("/login");
};

// =====================
// ✅ ROOT
// =====================
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// =====================
// ✅ AUTH ROUTES
// =====================

// 👤 USER REGISTER
app.get("/register", (req, res) => {
  res.render("users/register.ejs");
});

app.post(
  "/register",
  wrapAsync(async (req, res, next) => {
    const { username, email, password } = req.body;

    const newUser = new User({ username, email, role: "user" });
    const registeredUser = await User.register(newUser, password);

    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Registered Successfully ");
      res.redirect("/user/dashboard");
    });
  })
);

// 🔐 SINGLE LOGIN (ADMIN + USER)
app.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

app.post(
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

// 🚪 LOGOUT
app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.flash("success", "Logged out ");
    res.redirect("/listings");
  });
});

// =====================
// 👑 ADMIN REGISTER (SECRET KEY ONLY)
// =====================
app.get("/admin/register", (req, res) => {
  res.render("admin/register.ejs");
});

app.post(
  "/admin/register",
  wrapAsync(async (req, res) => {
    const { username, email, password, adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
      req.flash("error", "Invalid admin secret ❌");
      return res.redirect("/admin/register");
    }

    const admin = new User({ username, email, role: "admin" });
    await User.register(admin, password);

    req.flash("success", "Admin account created ");
    res.redirect("/login");
  })
);

// =====================
// 👑 ADMIN DASHBOARD
// =====================
app.get(
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
// ✅ LISTINGS ROUTES
// =====================

// ✅ ALL LISTINGS + SEARCH
app.get(
  "/listings",
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

// ✅ NEW LISTING FORM (STATIC ROUTE FIRST)
app.get("/listings/new", isAdmin, (req, res) => {
  res.render("listings/new.ejs");
});

// ✅ CREATE LISTING
app.post(
  "/listings",
  isAdmin,
  upload.single("listing[image]"),
  wrapAsync(async (req, res) => {

    const newListing = new Listing(req.body.listing);

    if (req.file) {
      newListing.image = `/uploads/${req.file.filename}`;
    }

    if (typeof newListing.facilities === "string") {
      newListing.facilities = newListing.facilities
        .split(",")
        .map(f => f.trim());
    }

    await newListing.save();
    req.flash("success", "New Listing Added ✅");
    res.redirect("/listings");
  })
);


// ✅ EDIT LISTING FORM
app.get(
  "/listings/:id/edit",
  isAdmin,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found ❌");
      return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
  })
);

app.put(
  "/listings/:id",
  isAdmin,
  upload.single("listing[image]"),
  wrapAsync(async (req, res) => {

    const listing = await Listing.findById(req.params.id);

    if (req.file) {
      req.body.listing.image = `/uploads/${req.file.filename}`;
    }

    await Listing.findByIdAndUpdate(req.params.id, req.body.listing);
    req.flash("success", "Listing Updated ✅");
    res.redirect(`/listings/${req.params.id}`);
  })
);


// ✅ DELETE LISTING (MISSING ROUTE ADDED ✅)
app.delete(
  "/listings/:id",
  isAdmin,
  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const deleted = await Listing.findByIdAndDelete(id);
    if (!deleted) {
      req.flash("error", "Listing not found ❌");
      return res.redirect("/listings");
    }

    req.flash("success", "Listing deleted successfully ✅");
    res.redirect("/listings");
  })
);

// ✅ SHOW LISTING (DYNAMIC ROUTE ALWAYS LAST)
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      req.flash("error", "Listing not found ❌");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  })
);

// =====================
// ✅ BOOKINGS ROUTES
// =====================

// ✅ CREATE BOOKING (USER)
app.post(
  "/listings/:id/bookings",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found ❌");
      return res.redirect("/listings");
    }

    const booking = new Booking(req.body.booking);
    booking.listing = listing._id;
    booking.user = req.user._id;

    await booking.save();

    req.flash("success", "Booking request submitted ✅");
    res.redirect("/my-bookings");
  })
);

// ✅ USER: MY BOOKINGS
app.get(
  "/my-bookings",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const myBookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 });

    res.render("bookings/myBookings.ejs", { myBookings });
  })
);

// ✅ ADMIN: ALL BOOKINGS
app.get(
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

// ✅ ADMIN: CONFIRM BOOKING (EXTRA ROUTE ADDED ✅)
app.put(
  "/bookings/:id/confirm",
  isAdmin,
  wrapAsync(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.redirect("/bookings");

    booking.status = "confirmed";
    await booking.save();

    req.flash("success", "Booking Confirmed ✅");
    res.redirect("/bookings");
  })
);

// ✅ ADMIN: CANCEL BOOKING (YOUR EXISTING ONE - CLEANED PLACE ✅)
app.put(
  "/bookings/:id/cancel",
  isAdmin,
  wrapAsync(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.redirect("/bookings");

    const listing = await Listing.findById(booking.listing);
    if (listing) {
      listing.availableSeats += booking.persons;
      await listing.save();
    }

    booking.status = "cancelled";
    await booking.save();

    req.flash("success", "Booking Cancelled ✅ Seats Restored");
    res.redirect("/bookings");
  })
);

// =====================
// 👤 USER DASHBOARD
// =====================
app.get(
  "/user/dashboard",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const totalBookings = await Booking.countDocuments({ user: req.user._id });
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
// ✅ 404 + ERROR HANDLER
// =====================
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// =====================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
