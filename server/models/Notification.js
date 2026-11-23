const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    relatedType: { type: String, enum: ["Listing", "Request", "Transaction", "Report", null], default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
