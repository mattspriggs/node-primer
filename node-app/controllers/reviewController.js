const mongoose = require("mongoose");
const Review = mongoose.model("Review");

exports.addReview = async (req, res) => {
  req.body.author = req.user._id;
  res.json(req.body);
};
