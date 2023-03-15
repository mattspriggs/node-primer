const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const slug = require("slugs");

const reviewSchema = new mongoose.Schema({
  created: {
    type: Date,
    default: Date.now(),
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: "You provide an author",
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: "Store",
    required: "You must supply a store",
  },
  text: {
    String,
    required: "Your review must have text!",
  },
  rating: {
    type: number,
    min: 1,
    max: 5,
  },
});

module.exports = mongoose.model("Review", reviewSchema);
