const Wishlist = require("../models/Wishlist");
const Listing = require("../models/Listing");

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.find({ user: req.user.id })
      .populate({ path: "listing", populate: { path: "owner", select: "name" } })
      .sort({ createdAt: -1 });
    res.json({ wishlist });
  } catch (error) { next(error); }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { listingId } = req.body;
    const listing = await Listing.findOne({ _id: listingId, status: "Active" });
    if (!listing) return res.status(404).json({ message: "Listing not found." });
    if (String(listing.owner) === req.user.id) return res.status(400).json({ message: "You cannot save your own listing." });

    const item = await Wishlist.findOneAndUpdate(
      { user: req.user.id, listing: listingId },
      { user: req.user.id, listing: listingId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ message: "Added to wishlist.", wishlistItem: item });
  } catch (error) { next(error); }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const item = await Wishlist.findOneAndDelete({ user: req.user.id, listing: req.params.listingId });
    if (!item) return res.status(404).json({ message: "Wishlist item not found." });
    res.json({ message: "Removed from wishlist." });
  } catch (error) { next(error); }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
