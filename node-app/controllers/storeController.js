// exports.myMiddleware = (req, res, next) => {
//   req.name = "Matt";
//   // res.cookie("name", "Matt is cool", { maxAge: 9000000 });Sets a cookie if needed
//   // if (req.name === "Matt") { To throw an error
//   next(); //passes it to the next middleware function in index.js
// };
const mongoose = require("mongoose");
const Store = mongoose.model("Store");

exports.homePage = (req, res) => {
  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
};

exports.createStore = async (req, res) => {
  const store = await new Store(req.body).save();
  req.flash(
    "success",
    `Successfully Created ${store.name}. Care to leave a review?`
  );
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  // Query the DB for a list of all stores
  const stores = await Store.find();
  console.log(stores);
  res.render("stores", { title: "Stores", stores }); //stores: stores is the same as just stores in ES6
};
