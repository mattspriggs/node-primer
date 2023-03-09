const passport = require("passport");

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
