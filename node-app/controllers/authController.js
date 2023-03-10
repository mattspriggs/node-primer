const passport = require("passport");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = mongoose.model("User");

exports.login = passport.authenticate("local", {
  failureRedirect: "login",
  failureFlash: "Login failed!",
  successRedirect: "/",
  successFlash: "You are now logged in!",
});

exports.logout = (req, res) => {
  req.logout();
  req.flash("success", "You are now logged out! 👋");
  res.redirect("/");
};

exports.isLoggedIn = (req, res, next) => {
  //first check if the user is logged in
  if (req.isAuthenticated()) {
    next(); //Carry on! They are logged in
    return;
  }
  req.flash("error", "Oops, you must be logged in to add a store!");
  res.redirect("/login");
};

exports.forgot = async (req, res) => {
  //See if the user has an email on account
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash("error", "Please check your email address and try again");
    return res.redirect("/login");
  }
  //Set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordExpires = Date.now() + 3600000; //1 hour from now in milliseconds
  await user.save();
  // Send email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  req.flash(
    "success",
    `You have been emailed a password reset link. ${resetURL}`
  );
  //redirect to login page
  res.redirect("/login");
};
