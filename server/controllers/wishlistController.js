const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const Listing = require("../models/Listing");

/**
 * @desc    Add listing to wishlist
 * @route   POST /api/wishlist
 * @access  Protected
 */
const addToWishlist = async (req, res, next) => {
  try {
    const { listingId, listing: bodyListing } = req.body;
    const targetListingId = listingId || bodyListing;

    if (!targetListingId || !mongoose.Types.ObjectId.isValid(targetListingId)) {
      return res.status(400).json({
        success: false,
        message: "A valid listing ID is required",
      });
    }

    const listing = await Listing.findById(targetListingId);

    if (!listing || listing.status === "Removed") {
      return res.status(404).json({
        success: false,
        message: "Listing not found or has been removed",
      });
    }

    // Check for duplicate entry
    const existing = await Wishlist.findOne({
      user: req.user._id,
      listing: listing._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Listing is already in your wishlist",
      });
    }

    const item = await Wishlist.create({
      user: req.user._id,
      listing: listing._id,
    });

    await item.populate({
      path: "listing",
      select: "title description category listingType price condition images status",
      populate: { path: "owner", select: "name profileImage" },
    });

    return res.status(201).json({
      success: true,
      message: "Listing added to wishlist",
      item,
    });
  } catch (error) {
    // Handle duplicate key error gracefully if hit concurrently
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Listing is already in your wishlist",
      });
    }
    next(error);
  }
};

/**
 * @desc    Get logged-in student's wishlist
 * @route   GET /api/wishlist
 * @access  Protected
 */
const getMyWishlist = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    const totalItems = await Wishlist.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const rawWishlist = await Wishlist.find(query)
      .populate({
        path: "listing",
        select: "title description category listingType price condition images status owner createdAt",
        populate: { path: "owner", select: "name profileImage" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out items whose referenced listing has been soft-removed
    const wishlist = rawWishlist.filter(
      (item) => item.listing && item.listing.status !== "Removed"
    );

    return res.status(200).json({
      success: true,
      wishlist,
      page,
      limit,
      totalItems,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove listing from wishlist
 * @route   DELETE /api/wishlist/:id
 * @access  Protected
 */
const removeFromWishlist = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Invalid wishlist item ID format",
      });
    }

    // Try finding by Wishlist document ID first, or by Listing ID
    let item = await Wishlist.findOne({ _id: id, user: req.user._id });

    if (!item) {
      item = await Wishlist.findOne({ listing: id, user: req.user._id });
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Wishlist item not found",
      });
    }

    await item.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Listing removed from wishlist",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
};

