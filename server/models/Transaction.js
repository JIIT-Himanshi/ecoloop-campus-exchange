const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing reference is required"],
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: [true, "Request reference is required"],
      unique: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester reference is required"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner reference is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["InProgress", "Completed", "Cancelled"],
        message: "Status must be InProgress, Completed, or Cancelled",
      },
      default: "InProgress",
    },
    requesterConfirmed: {
      type: Boolean,
      default: false,
    },
    ownerConfirmed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for participant query lookup
transactionSchema.index({ requester: 1, status: 1 });
transactionSchema.index({ owner: 1, status: 1 });
transactionSchema.index({ listing: 1, status: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;

