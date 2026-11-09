const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Request = require("../models/Request");
const Listing = require("../models/Listing");

/**
 * @desc    Get transactions where logged-in user is requester or owner
 * @route   GET /api/transactions
 * @access  Protected
 */
const getMyTransactions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {
      $or: [{ requester: req.user._id }, { owner: req.user._id }],
    };

    const totalTransactions = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / limit) || 1;

    const transactions = await Transaction.find(query)
      .populate("listing", "title images price listingType status condition")
      .populate("requester", "name profileImage email")
      .populate("owner", "name profileImage email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      transactions,
      page,
      limit,
      totalTransactions,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transaction details by ID
 * @route   GET /api/transactions/:id
 * @access  Protected (Participants only)
 */
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found (invalid ID format)",
      });
    }

    const transaction = await Transaction.findById(id)
      .populate("listing", "title images price listingType status condition")
      .populate("request", "message status createdAt")
      .populate("requester", "name profileImage email")
      .populate("owner", "name profileImage email");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Verify user is a participant
    const isRequester = transaction.requester._id.toString() === req.user._id.toString();
    const isOwner = transaction.owner._id.toString() === req.user._id.toString();

    if (!isRequester && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this transaction",
      });
    }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm completion of transaction
 * @route   PATCH /api/transactions/:id/confirm
 * @access  Protected (Participants only)
 */
const confirmCompletion = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found (invalid ID format)",
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const isRequester = transaction.requester.toString() === req.user._id.toString();
    const isOwner = transaction.owner.toString() === req.user._id.toString();

    if (!isRequester && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to confirm this transaction",
      });
    }

    if (transaction.status !== "InProgress") {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm a transaction that is ${transaction.status}`,
      });
    }

    // Prevent duplicate confirmation by same participant
    if (isRequester && transaction.requesterConfirmed) {
      return res.status(400).json({
        success: false,
        message: "You have already confirmed completion of this transaction",
      });
    }

    if (isOwner && transaction.ownerConfirmed) {
      return res.status(400).json({
        success: false,
        message: "You have already confirmed completion of this transaction",
      });
    }

    if (isRequester) transaction.requesterConfirmed = true;
    if (isOwner) transaction.ownerConfirmed = true;

    let fullyCompleted = false;

    // Both parties have confirmed
    if (transaction.requesterConfirmed && transaction.ownerConfirmed) {
      transaction.status = "Completed";
      transaction.completedAt = new Date();
      fullyCompleted = true;

      // Update related Request and Listing to Completed
      await Request.findByIdAndUpdate(transaction.request, { status: "Completed" });
      await Listing.findByIdAndUpdate(transaction.listing, { status: "Completed" });
    }

    await transaction.save();
    await transaction.populate("listing", "title images price listingType status condition");
    await transaction.populate("requester", "name profileImage email");
    await transaction.populate("owner", "name profileImage email");

    return res.status(200).json({
      success: true,
      message: fullyCompleted
        ? "Transaction successfully completed by both participants"
        : "Your confirmation has been recorded. Waiting for other participant to confirm.",
      transaction,
      isFullyCompleted: fullyCompleted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an in-progress transaction
 * @route   PATCH /api/transactions/:id/cancel
 * @access  Protected (Participants only)
 */
const cancelTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found (invalid ID format)",
      });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const isRequester = transaction.requester.toString() === req.user._id.toString();
    const isOwner = transaction.owner.toString() === req.user._id.toString();

    if (!isRequester && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this transaction",
      });
    }

    if (transaction.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a transaction that has already been completed",
      });
    }

    if (transaction.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Transaction is already cancelled",
      });
    }

    transaction.status = "Cancelled";
    await transaction.save();

    // Update related request to Cancelled
    await Request.findByIdAndUpdate(transaction.request, { status: "Cancelled" });

    // Restore listing to Active only if it is still Reserved
    const listing = await Listing.findById(transaction.listing);
    if (listing && listing.status === "Reserved") {
      listing.status = "Active";
      await listing.save();
    }

    return res.status(200).json({
      success: true,
      message: "Transaction cancelled and listing restored to Active",
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyTransactions,
  getTransactionById,
  confirmCompletion,
  cancelTransaction,
};

