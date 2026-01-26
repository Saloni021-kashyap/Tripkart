const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// ✅ Fix for object/default export issue
let passportLocalMongoose = require("passport-local-mongoose");
passportLocalMongoose = passportLocalMongoose.default || passportLocalMongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  { timestamps: true }
);

// ✅ Now plugin will work
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
