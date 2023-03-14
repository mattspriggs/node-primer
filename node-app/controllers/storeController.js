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
  req.body.author = req.user._id;
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

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error("You must own a store in order to edit it!");
  }
};

exports.editStore = async (req, res) => {
  //Find store by ID
  const store = await Store.findOne({ _id: req.params.id });
  //confirm that they own the store
  confirmOwner(store, req.user);
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

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate(
    "author"
  );
  if (!store) return next();
  res.render("store", { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render("tag", { tags, title: "Tags", tag, stores });
};

exports.searchStores = async (req, res) => {
  const stores = await Store
    //first find stores that match
    .find(
      {
        $text: {
          $search: req.query.q,
        },
      },
      {
        score: { $meta: "textScore" },
      }
    )
    //Then sort them by the score
    .sort({
      score: { $meta: "textScore" },
    })
    //limit to only 5 stores
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  res.json({ it: "WORKS!" });
};
