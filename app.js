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
const ExpressError = require("./utils/ExpressError");

// =====================
// MIDDLEWARE SETUP
// =====================
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =====================
// SESSION + FLASH
// =====================
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

// =====================
// PASSPORT
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

  // auth related
  res.locals.currUser = req.user || null;
  res.locals.isAdmin =
    req.isAuthenticated() && req.user.role === "admin";

  next();
});


// =====================
// DATABASE
// =====================
mongoose
  .connect(process.env.ATLASTDB_URL)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.log(err));

// =====================
// ROUTES
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
// ROOT
// =====================
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// =====================
// ❌ 404 NOT FOUND (SAFE FOR NODE 22)
// =====================
app.use((req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});



// =====================
// ⚠️ GLOBAL ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error", { message });
});


app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { err });
});

// =====================
// SERVER
// =====================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
