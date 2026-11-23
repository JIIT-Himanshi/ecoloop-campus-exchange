const mongoose = require("mongoose");
const Listing = require("../models/Listing");
const Report = require("../models/Report");

const createReport = async (req, res, next) => {
  try {
    const subject = typeof req.body.subject === "string" ? req.body.subject.trim() : "";
    const description =
      typeof req.body.description === "string" ? req.body.description.trim() : "";
    const listingId = req.body.listingId;

    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required." });
    }

    if (subject.length > 120 || description.length > 1500) {
      return res.status(400).json({ message: "Report details exceed the allowed length." });
    }

    let listing = null;
    if (listingId) {
      if (!mongoose.Types.ObjectId.isValid(listingId)) {
        return res.status(400).json({ message: "Invalid listing ID." });
      }

      listing = await Listing.findById(listingId).select("_id");
      if (!listing) {
        return res.status(404).json({ message: "Listing not found." });
      }
    }

    const report = await Report.create({
      subject,
      description,
      reporter: req.user.id,
      listing: listing ? listing._id : null,
    });

    res.status(201).json({ message: "Report submitted successfully.", report });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport };
