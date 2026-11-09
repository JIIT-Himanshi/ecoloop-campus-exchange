const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Listing title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Listing description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    listingType: {
      type: String,
      required: [true, "Listing type is required"],
      enum: {
        values: ["Sell", "Exchange", "Donate"],
        message: "Listing type must be Sell, Exchange, or Donate",
      },
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
      validate: {
        validator: function (val) {
          if (this.listingType === "Sell") {
            return typeof val === "number" && val >= 0;
          }
          return true;
        },
        message: "Price is required for Sell listings",
      },
    },
    condition: {
      type: String,
      required: [true, "Item condition is required"],
      enum: {
        values: ["New", "Like New", "Good", "Fair"],
        message: "Condition must be New, Like New, Good, or Fair",
      },
    },
    images: {
      type: [String],
      default: [],
    },
    exchangePreference: {
      type: String,
      trim: true,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Listing owner is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["Active", "Reserved", "Completed", "Removed"],
        message: "Status must be Active, Reserved, Completed, or Removed",
      },
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries and search performance
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ category: 1, status: 1 });
listingSchema.index({ listingType: 1, status: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ title: "text", description: "text" });

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;

