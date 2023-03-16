const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const slug = require("slugs");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: "Please enter a store name!",
    },
    slug: String,
    description: {
      type: String,
      trim: true,
    },
    tags: [String],
    created: {
      type: Date,
      default: Date.now(),
    },
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: [
        {
          type: Number,
          required: "You must supply coordinates",
        },
      ],
      address: {
        type: String,
        required: "You must provide an address",
      },
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: "You must supply an author",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Define the indexes
storeSchema.index({
  name: "text",
  description: "text",
});

storeSchema.index({ location: "2dsphere" });

storeSchema.pre("save", async function (next) {
  if (!this.isModified("name")) {
    next(); //skip it
    return; //stop this function
  }
  this.slug = slug(this.name);
  //Ensure that there are unique names
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});

storeSchema.statics.getTagsList = function () {
  return this.aggregate([
    //this is the pipeline operator for MongoDB
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

storeSchema.statics.getTopStores = function () {
  return this.aggregate([
    //Lookup stores and populate their reviews
    {
      $lookup: {
        from: "reviews", //MongoDB takes the Review model and provides reviews
        localField: "_id",
        foreignField: "store",
        as: "reviews", //Names the new field
      },
    },
    //Filter for only items that have 2 or more reviews
    { $match: { "reviews.1": { $exists: true } } }, //reviews.1 will return true if there is a 2nd in the reviews array
    //Add the average reviews field
    {
      $project: {
        // $addFields: {
        //MongoDB(3.4) should provide addFields instead of project to just add a field, project requires you to
        // add the fields back in that you want in earlier versions
        photo: "$$ROOT.photo",
        name: "$$ROOT.name",
        reviews: "$$ROOT.reviews",
        slug: "$$ROOT.slug",
        averageRating: { $avg: "$reviews.rating" },
      },
    },
    //Sort it by our new field with highest reviews first
    { $sort: { averageRating: -1 } },
    //Limit to at most 10 stores
    { $limit: 10 },
  ]);
};

//find reviews where the store _id property === review store property
storeSchema.virtual("reviews", {
  ref: "Review", //What model to link
  localField: "_id", //Which field on the store
  foreignField: "store", //Which field on the review
});

module.exports = mongoose.model("Store", storeSchema);
