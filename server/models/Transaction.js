const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: "Request", required: true, unique: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["For Sale", "Exchange", "Donation"], required: true },
    status: { type: String, enum: ["In Progress", "Completed"], default: "In Progress" },
    ownerConfirmed: { type: Boolean, default: false },
    requesterConfirmed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    ecoPointsAwarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
