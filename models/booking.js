const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    // 🔗 Which travel package
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    // 👤 User reference (NULL for Guest)
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // 👈 guest booking ke liye
    },

    // 🧍 Customer details
    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    persons: {
      type: Number,
      required: true,
      min: 1,
    },

    travelDate: {
      type: Date,
      required: true,
    },

    // 📌 Booking status (Admin controlled)
   status: {
  type: String,
  enum: ["pending", "confirmed", "cancel_requested", "cancelled"],
  default: "pending",
},

cancelReason: {
  type: String,
  trim: true,
  default: ""
},

  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
