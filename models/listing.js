const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    // ✅ CLOUDINARY IMAGES
    images: [
      {
        url: String,
        filename: String,
      },
    ],

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    startLocation: {
      type: String,
      required: true,
    },

    endLocation: {
      type: String,
      required: true,
    },

    travelMode: {
      type: String,
      enum: ["Bus", "Train", "Flight"],
      default: "Bus",
    },

    category: {
      type: String,
      enum: ["Pilgrimage", "Winter", "Beach", "Adventure", "City", "Family"],
      default: "Pilgrimage",
    },

    facilities: {
      type: [String],
      default: [],
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    availableSeats: {
      type: Number,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    country: {
      type: String,
      default: "India",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);
