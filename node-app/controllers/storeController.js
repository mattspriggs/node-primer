// exports.myMiddleware = (req, res, next) => {
//   req.name = "Matt";
//   // res.cookie("name", "Matt is cool", { maxAge: 9000000 });Sets a cookie if needed
//   // if (req.name === "Matt") { To throw an error
//   next(); //passes it to the next middleware function in index.js
// };
const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const User = mongoose.model("User");
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
  const page = req.params.page || 1;
  const limit = 4;
  const skip = page * limit - limit;
  // Query the DB for a list of all stores
  const storesPromise = Store.find()
    .skip(skip)
    .limit(limit)
    .sort({ created: "desc" });
  const countPromise = Store.count();
  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!stores.length && skip) {
    req.flash(
      "info",
      `Hey you asked for page ${page}. That page does not exist so I put you on page ${pages}`
    );
    res.redirect(`/stores/page/${pages}`);
    return;
  }
  res.render("stores", { title: "Stores", stores, page, pages, count }); //stores: stores is the same as just stores
  // in ES6
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
    "author reviews"
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
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: 10000, //10km
      },
    },
  };
  const stores = await Store.find(q)
    .select("slug name description location photo")
    .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render("map", { title: "Map" });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map((obj) => obj.toString());
  const operator = hearts.includes(req.params.id) ? "$pull" : "$addToSet";
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { [operator]: { hearts: req.params.id } },
    { new: true }
  );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }, //gets the stores that are in the array of hearted stores of the user
  });
  res.render("stores", { title: "Hearted Stores", stores: stores });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  res.render("topStores", { stores, title: "⭐ Top Stores!" });
};
