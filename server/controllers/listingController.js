const Listing = require("../models/Listing");
const Wishlist = require("../models/Wishlist");
const { cloudinary, cloudinaryConfigured } = require("../config/cloudinary");

const uploadImage = async (file) => {
  if (!file) return {};
  if (!cloudinaryConfigured) throw Object.assign(new Error("Image uploads require Cloudinary credentials in server/.env."), { statusCode: 400 });

  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, { folder: "ecoloop/listings" });
  return { imageUrl: result.secure_url, imagePublicId: result.public_id };
};

const getListings = async (req, res, next) => {
  try {
    const { search, category, type, sort } = req.query;
    const filter = { status: "Active" };
    if (category && category !== "All") filter.category = category;
    if (type && type !== "All") filter.type = type;
    if (search) filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];

    const sortOption = sort === "price-low" ? { price: 1 } :
      sort === "price-high" ? { price: -1 } : { createdAt: -1 };

    const listings = await Listing.find(filter).populate("owner", "name studentId").sort(sortOption);
    res.json({ listings });
  } catch (error) { next(error); }
};

const createListing = async (req, res, next) => {
  try {
    const image = await uploadImage(req.file);
    const listing = await Listing.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      type: req.body.type,
      condition: req.body.condition,
      price: req.body.type === "For Sale" ? Number(req.body.price) : 0,
      exchangeFor: req.body.type === "Exchange" ? req.body.exchangeFor : "",
      location: req.body.location,
      owner: req.user.id,
      ...image,
      status: "Pending",
    });
    const populated = await listing.populate("owner", "name studentId");
    res.status(201).json({ message: "Listing created successfully.", listing: populated });
  } catch (error) { next(error); }
};

const getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ owner: req.user.id }).populate("owner", "name").sort({ createdAt: -1 });
    res.json({ listings });
  } catch (error) { next(error); }
};

const getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("owner", "name studentId");
    if (!listing || (listing.status !== "Active" && String(listing.owner._id) !== req.user?.id)) {
      return res.status(404).json({ message: "Listing not found." });
    }
    res.json({ listing });
  } catch (error) { next(error); }
};

const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, owner: req.user.id });
    if (!listing) return res.status(404).json({ message: "Listing not found." });

    const fields = ["title", "description", "category", "type", "condition", "location", "exchangeFor"];
    fields.forEach((field) => { if (req.body[field] !== undefined) listing[field] = req.body[field]; });
    if (req.body.price !== undefined) listing.price = Number(req.body.price);
    if (req.file) Object.assign(listing, await uploadImage(req.file));
    await listing.save();
    await listing.populate("owner", "name studentId");
    res.json({ message: "Listing updated successfully.", listing });
  } catch (error) { next(error); }
};

const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, owner: req.user.id });
    if (!listing) return res.status(404).json({ message: "Listing not found." });
    if (listing.imagePublicId && cloudinaryConfigured) {
      await cloudinary.uploader.destroy(listing.imagePublicId).catch(() => {});
    }
    await Wishlist.deleteMany({ listing: listing._id });
    await listing.deleteOne();
    res.json({ message: "Listing deleted successfully." });
  } catch (error) { next(error); }
};

module.exports = { getListings, createListing, getMyListings, getListingById, updateListing, deleteListing };
