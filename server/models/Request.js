const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: [true, "Listing reference is required"],
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
    message: {
      type: String,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "Accepted", "Rejected", "Cancelled", "Completed"],
        message: "Status must be Pending, Accepted, Rejected, Cancelled, or Completed",
      },
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup of incoming and outgoing requests
requestSchema.index({ listing: 1, requester: 1 });
requestSchema.index({ owner: 1, status: 1 });
requestSchema.index({ requester: 1, status: 1 });

const Request = mongoose.model("Request", requestSchema);

module.exports = Request;

