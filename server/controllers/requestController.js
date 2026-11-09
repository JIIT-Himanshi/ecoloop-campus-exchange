const mongoose = require("mongoose");
const Request = require("../models/Request");
const Listing = require("../models/Listing");
const Transaction = require("../models/Transaction");

/**
 * @desc    Send a request for a listing
 * @route   POST /api/requests
 * @access  Protected (Authenticated Student)
 */
const createRequest = async (req, res, next) => {
  try {
    const { listingId, listing: bodyListing, message } = req.body;
    const targetListingId = listingId || bodyListing;

    if (!targetListingId || !mongoose.Types.ObjectId.isValid(targetListingId)) {
      return res.status(400).json({
        success: false,
        message: "A valid listing ID is required",
      });
    }

    const listing = await Listing.findById(targetListingId);

    if (!listing || listing.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Listing not found or is no longer active",
      });
    }

    // Prevent requesting own listing
    if (listing.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot request your own listing",
      });
    }

    // Prevent duplicate active requests (Pending or Accepted)
    const existingRequest = await Request.findOne({
      listing: listing._id,
      requester: req.user._id,
      status: { $in: ["Pending", "Accepted"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have an active request for this listing",
      });
    }

    const newRequest = await Request.create({
      listing: listing._id,
      requester: req.user._id,
      owner: listing.owner,
      message: message ? message.trim() : "",
      status: "Pending",
    });

    await newRequest.populate("listing", "title images price listingType status condition");
    await newRequest.populate("owner", "name profileImage email");

    return res.status(201).json({
      success: true,
      message: "Request sent successfully",
      request: newRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get requests sent by the logged-in student
 * @route   GET /api/requests/sent
 * @access  Protected
 */
const getMySentRequests = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { requester: req.user._id };

    const totalRequests = await Request.countDocuments(query);
    const totalPages = Math.ceil(totalRequests / limit) || 1;

    const requests = await Request.find(query)
      .populate("listing", "title images price listingType status condition")
      .populate("owner", "name profileImage email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      requests,
      page,
      limit,
      totalRequests,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get requests received for the logged-in student's listings
 * @route   GET /api/requests/received
 * @access  Protected
 */
const getIncomingRequests = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { owner: req.user._id };

    const totalRequests = await Request.countDocuments(query);
    const totalPages = Math.ceil(totalRequests / limit) || 1;

    const requests = await Request.find(query)
      .populate("listing", "title images price listingType status condition")
      .populate("requester", "name profileImage email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      requests,
      page,
      limit,
      totalRequests,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept or reject a pending request (Owner only)
 * @route   PATCH /api/requests/:id/status
 * @access  Protected
 */
const updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Request not found (invalid ID format)",
      });
    }

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status update. Allowed values: Accepted, Rejected",
      });
    }

    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Verify only the listing owner can accept or reject
    if (request.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to respond to this request",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot update a request that is already ${request.status}`,
      });
    }

    if (status === "Rejected") {
      request.status = "Rejected";
      await request.save();

      return res.status(200).json({
        success: true,
        message: "Request rejected successfully",
        request,
      });
    }

    // Status is 'Accepted'
    const listing = await Listing.findById(request.listing);

    if (!listing || listing.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Listing is no longer active and cannot be accepted",
      });
    }

    // Check if an in-progress transaction already exists for this listing
    const existingTransaction = await Transaction.findOne({
      listing: listing._id,
      status: "InProgress",
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: "A transaction is already in progress for this listing",
      });
    }

    // Transition listing to Reserved
    listing.status = "Reserved";
    await listing.save();

    // Update request to Accepted
    request.status = "Accepted";
    await request.save();

    // Create InProgress transaction
    const transaction = await Transaction.create({
      listing: listing._id,
      request: request._id,
      requester: request.requester,
      owner: request.owner,
      status: "InProgress",
      requesterConfirmed: false,
      ownerConfirmed: false,
    });

    return res.status(200).json({
      success: true,
      message: "Request accepted and transaction initiated",
      request,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a pending request (Requester only)
 * @route   PATCH /api/requests/:id/cancel
 * @access  Protected
 */
const cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Request not found (invalid ID format)",
      });
    }

    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Only requester can cancel
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this request",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a request that is already ${request.status}`,
      });
    }

    request.status = "Cancelled";
    await request.save();

    return res.status(200).json({
      success: true,
      message: "Request cancelled successfully",
      request,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getMySentRequests,
  getIncomingRequests,
  updateRequestStatus,
  cancelRequest,
};

