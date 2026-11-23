const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["Pending", "Accepted", "Rejected", "Cancelled", "Completed"], default: "Pending" },
  },
  { timestamps: true }
);

requestSchema.index({ listing: 1, requester: 1 }, { unique: true });
module.exports = mongoose.model("Request", requestSchema);
