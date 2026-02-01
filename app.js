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

const User = require("./models/user");

// =====================
// 🔧 BASIC MIDDLEWARE
// =====================
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =====================
// 🧾 SESSION + FLASH
// =====================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallbacksecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

// =====================
// 🔑 PASSPORT CONFIG
// =====================
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// =====================
// 🌍 GLOBAL LOCALS
// =====================
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user || null;
  res.locals.isAdmin = req.user && req.user.role === "admin";
  next();
});

// =====================
// 🗄️ DATABASE
// =====================
const dbUrl = process.env.ATLASDB_URL;

mongoose
  .connect(dbUrl)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

// =====================
// 🚏 ROUTES
// =====================
const listingRoutes = require("./routes/listings");
const bookingRoutes = require("./routes/booking");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");

app.use("/listings", listingRoutes);
app.use("/bookings", bookingRoutes);
app.use("/", userRoutes);
app.use("/", adminRoutes);

// =====================
// 🏠 ROOT
// =====================
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// =====================
// ❌ 404 HANDLER
// =====================
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

// =====================
// ⚠️ GLOBAL ERROR HANDLER (FINAL FIX)
// =====================
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR 👉", err);
  res.status(500).send("Server error. Check logs.");
});

// =====================
// 🚀 SERVER
// =====================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
