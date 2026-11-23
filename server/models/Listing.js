const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1500 },
    category: { type: String, required: true, enum: ["Books & Notes", "Electronics", "Stationery", "Other"] },
    type: { type: String, required: true, enum: ["For Sale", "Exchange", "Donation"] },
    condition: { type: String, required: true, enum: ["New", "Like New", "Good", "Fair"] },
    price: { type: Number, default: 0, min: 0 },
    exchangeFor: { type: String, trim: true, default: "" },
    location: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Pending", "Active", "Rejected", "Inactive", "Completed"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);
