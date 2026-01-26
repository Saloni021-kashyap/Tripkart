const Joi = require("joi");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().min(3).required(),
    destination: Joi.string().trim().required(),
    description: Joi.string().trim().min(10).required(),
   image: Joi.any().optional(),
    price: Joi.number().min(0).required(),
    startLocation: Joi.string().trim().required(),
    endLocation: Joi.string().trim().required(),
    travelMode: Joi.string().valid("Bus", "Train", "Flight").required(),
    category: Joi.string()
    .valid("Pilgrimage", "Winter", "Beach", "Adventure", "City", "Family")
    .required(),
    facilities: Joi.alternatives().try(
      Joi.array().items(Joi.string().trim()),
      Joi.string().allow("")
    ),
    totalSeats: Joi.number().integer().min(1).required(),
    availableSeats: Joi.number().integer().min(0).required(),
    isActive: Joi.boolean().default(true),
    country: Joi.string().default("India"),
  }).required(),
});

module.exports.bookingSchema = Joi.object({
  booking: Joi.object({
    customerName: Joi.string().trim().min(3).required(),
    phone: Joi.string().trim().pattern(/^[0-9]{10}$/).required(),
    persons: Joi.number().integer().min(1).required(),
    travelDate: Joi.date().required(),
  }).required(),
});
