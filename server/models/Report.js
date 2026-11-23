const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 1500 },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", default: null },
    status: { type: String, enum: ["Pending", "Resolved", "Dismissed"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
