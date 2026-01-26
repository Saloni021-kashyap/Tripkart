const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    destination: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

image: {
  type: String,
  default:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  set: (v) =>
    v === ""
      ? "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
      : v,
},

 


    price: {
      type: Number,
      required: true,
      min: 0
    },

 
    startLocation: {
      type: String,
      required: true
    },

    endLocation: {
      type: String,
      required: true
    },

    travelMode: {
      type: String,
      enum: ["Bus", "Train", "Flight"],
      default: "Bus"
    },
    category: {
    type: String,
    enum: ["Pilgrimage", "Winter", "Beach", "Adventure", "City", "Family"],
    default: "Pilgrimage"
    },


    facilities: {
      type: [String],
      default: []
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1
    },

    availableSeats: {
      type: Number,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    country: {
      type: String,
      default: "India"
    }
  },
  { timestamps: true }
);

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;