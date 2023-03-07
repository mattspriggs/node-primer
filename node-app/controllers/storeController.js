// exports.myMiddleware = (req, res, next) => {
//   req.name = "Matt";
//   // res.cookie("name", "Matt is cool", { maxAge: 9000000 });Sets a cookie if needed
//   // if (req.name === "Matt") { To throw an error
//   next(); //passes it to the next middleware function in index.js
// };
const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype is not allowed!" }, false);
    }
  },
};

exports.homePage = (req, res) => {
  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
};
//Photo middleware
exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split("/")[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  //now resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  //Once it is written to the file system keep going!
  next();
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
  res.render("stores", { title: "Stores", stores }); //stores: stores is the same as just stores in ES6
};

exports.editStore = async (req, res) => {
  //Find store by ID
  const store = await Store.findOne({ _id: req.params.id });
  //confirm that they own the store
  //TODO
  //render out the edit form to the user can update their store
  res.render("editStore", { title: `Edit ${store.name}`, store: store }); //could also be just store
};

exports.updateStore = async (req, res) => {
  //Set the location data to be a point
  req.body.location.type = "Point";

  //find and update store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, //returns new store instead of the old one
    runValidators: true,
  }).exec();
  req.flash(
    "success",
    `Successfully update <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
  //Redirect to store and tell them it worked
};
