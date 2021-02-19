const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.SchemaTypes.ObjectId },
    username: { type: String },
    review: { type: String, trim: true },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = {
  Review,
  reviewSchema,
};
