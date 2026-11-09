const mongoose = require("mongoose");
const Listing = require("../models/Listing");
const { uploadToCloudinary } = require("../config/cloudinary");

/**
 * @desc    Create a new resource listing
 * @route   POST /api/listings
 * @access  Protected (Authenticated students)
 */
const createListing = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      listingType,
      price,
      condition,
      exchangePreference,
    } = req.body;

    // Validate mandatory fields
    if (!title || !description || !category || !listingType || !condition) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: title, description, category, listingType, condition",
      });
    }

    // Validate listing type
    const validListingTypes = ["Sell", "Exchange", "Donate"];
    if (!validListingTypes.includes(listingType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid listingType. Allowed: Sell, Exchange, Donate",
      });
    }

    // Validate condition
    const validConditions = ["New", "Like New", "Good", "Fair"];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: "Invalid condition. Allowed: New, Like New, Good, Fair",
      });
    }

    // Validate price based on listingType
    let parsedPrice = 0;
    if (listingType === "Sell") {
      if (price === undefined || price === null || isNaN(Number(price))) {
        return res.status(400).json({
          success: false,
          message: "Price is required for Sell listings and must be a valid number",
        });
      }
      parsedPrice = Number(price);
      if (parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Price cannot be negative",
        });
      }
    } else {
      // Donate or Exchange listings do not have a price
      parsedPrice = 0;
    }

    // Process image uploads if present
    const imageUrls = [];

    // 1. Files uploaded via Multer
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        imageUrls.push(url);
      }
    }

    // 2. Direct image URLs provided in request body
    if (req.body.images) {
      const bodyImages = Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.images];
      imageUrls.push(...bodyImages.filter((img) => typeof img === "string" && img.trim()));
    }

    // Create listing with owner assigned strictly from authenticated user
    const listing = await Listing.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      listingType,
      price: parsedPrice,
      condition,
      images: imageUrls,
      exchangePreference: exchangePreference ? exchangePreference.trim() : "",
      owner: req.user._id,
      status: "Active",
    });

    // Populate safe owner details for response
    await listing.populate("owner", "name profileImage email");

    return res.status(201).json({
      success: true,
      message: "Listing created successfully",
      listing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active listings with search, filter, sort & pagination
 * @route   GET /api/listings
 * @access  Protected
 */
const getAllListings = async (req, res, next) => {
  try {
    const {
      search,
      category,
      listingType,
      condition,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // Base query: show only active listings
    const query = { status: "Active" };

    // Search by title or description (case-insensitive)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Filter by category
    if (category && category.trim()) {
      query.category = category.trim();
    }

    // Filter by listingType
    if (listingType && listingType.trim()) {
      query.listingType = listingType.trim();
    }

    // Filter by condition
    if (condition && condition.trim()) {
      query.condition = condition.trim();
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Sorting configuration
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === "price_asc" || sort === "price-low") {
      sortOption = { price: 1, createdAt: -1 };
    } else if (sort === "price_desc" || sort === "price-high") {
      sortOption = { price: -1, createdAt: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Execute query with count
    const totalListings = await Listing.countDocuments(query);
    const totalPages = Math.ceil(totalListings / limitNum) || 1;

    const listings = await Listing.find(query)
      .populate("owner", "name profileImage email")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      listings,
      page: pageNum,
      limit: limitNum,
      totalListings,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single listing by ID
 * @route   GET /api/listings/:id
 * @access  Protected
 */
const getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Listing not found (invalid ID format)",
      });
    }

    const listing = await Listing.findById(id).populate(
      "owner",
      "name profileImage email ecoPoints"
    );

    if (!listing || listing.status === "Removed") {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    return res.status(200).json({
      success: true,
      listing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update own listing
 * @route   PUT /api/listings/:id
 * @access  Protected (Owner only)
 */
const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Listing not found (invalid ID format)",
      });
    }

    const listing = await Listing.findById(id);

    if (!listing || listing.status === "Removed") {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    // Verify ownership
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this listing",
      });
    }

    // Cannot edit non-Active listings
    if (listing.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Only Active listings can be edited",
      });
    }

    const {
      title,
      description,
      category,
      listingType,
      price,
      condition,
      exchangePreference,
    } = req.body;

    if (title !== undefined) listing.title = title.trim();
    if (description !== undefined) listing.description = description.trim();
    if (category !== undefined) listing.category = category.trim();
    if (condition !== undefined) listing.condition = condition;
    if (exchangePreference !== undefined)
      listing.exchangePreference = exchangePreference.trim();

    // Handle listingType & price updates
    const targetType = listingType || listing.listingType;
    if (listingType !== undefined) {
      const validTypes = ["Sell", "Exchange", "Donate"];
      if (!validTypes.includes(listingType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid listingType. Allowed: Sell, Exchange, Donate",
        });
      }
      listing.listingType = listingType;
    }

    if (targetType === "Sell") {
      if (price !== undefined) {
        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice < 0) {
          return res.status(400).json({
            success: false,
            message: "Price must be a non-negative number for Sell listings",
          });
        }
        listing.price = numPrice;
      }
    } else {
      listing.price = 0;
    }

    // Handle newly uploaded images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        listing.images.push(url);
      }
    }

    // Ensure protected fields cannot be altered via update
    // owner and status remain unchanged

    await listing.save();
    await listing.populate("owner", "name profileImage email");

    return res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      listing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete (remove) own listing
 * @route   DELETE /api/listings/:id
 * @access  Protected (Owner only)
 */
const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Listing not found (invalid ID format)",
      });
    }

    const listing = await Listing.findById(id);

    if (!listing || listing.status === "Removed") {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    // Verify ownership
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this listing",
      });
    }

    // Soft delete by updating status to Removed
    listing.status = "Removed";
    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Listing removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
};

