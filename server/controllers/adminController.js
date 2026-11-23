const User = require("../models/User");
const Listing = require("../models/Listing");
const Request = require("../models/Request");
const Transaction = require("../models/Transaction");
const Report = require("../models/Report");
const { cloudinary, cloudinaryConfigured } = require("../config/cloudinary");

const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalListings, pendingListings, totalRequests, completedTransactions] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: "Pending" }),
      Request.countDocuments(),
      Transaction.countDocuments({ status: "Completed" }),
    ]);
    res.json({ stats: { totalUsers, totalListings, pendingListings, totalRequests, completedTransactions } });
  } catch (error) { next(error); }
};

const getAdminListings = async (req, res, next) => {
  try {
    const listings = await Listing.find().populate("owner", "name email").sort({ createdAt: -1 });
    res.json({ listings });
  } catch (error) { next(error); }
};

const updateListingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["Active", "Rejected"].includes(status)) return res.status(400).json({ message: "Status must be Active or Rejected." });
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate("owner", "name");
    if (!listing) return res.status(404).json({ message: "Listing not found." });
    res.json({ message: "Listing status updated.", listing });
  } catch (error) { next(error); }
};

const deleteAdminListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found." });

    if (listing.imagePublicId) {
      if (!cloudinaryConfigured) {
        return res.status(503).json({
          message: "Cloudinary is not configured; the listing was not deleted.",
        });
      }

      try {
        const result = await cloudinary.uploader.destroy(listing.imagePublicId);
        if (result.result !== "ok" && result.result !== "not found") {
          return res.status(502).json({
            message: "Unable to remove the listing image; the listing was not deleted.",
          });
        }
      } catch (error) {
        console.error("Cloudinary image deletion failed.", error.http_code || error.name);
        return res.status(502).json({
          message: "Unable to remove the listing image; the listing was not deleted.",
        });
      }
    }

    await listing.deleteOne();
    res.json({ message: "Listing deleted." });
  } catch (error) { next(error); }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("name email studentId ecoPoints role isActive createdAt").sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) { next(error); }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.role === "admin") return res.status(400).json({ message: "Admin accounts cannot be deactivated here." });
    user.isActive = Boolean(req.body.isActive);
    await user.save();
    res.json({ message: "User status updated.", user: { _id: user._id, isActive: user.isActive } });
  } catch (error) { next(error); }
};

const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find().populate("reporter", "name email").sort({ createdAt: -1 });
    res.json({ reports });
  } catch (error) { next(error); }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["Resolved", "Dismissed"].includes(status)) return res.status(400).json({ message: "Invalid report status." });
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate("reporter", "name");
    if (!report) return res.status(404).json({ message: "Report not found." });
    res.json({ message: "Report status updated.", report });
  } catch (error) { next(error); }
};

module.exports = { getDashboardStats, getAdminListings, updateListingStatus, deleteAdminListing, getUsers, updateUserStatus, getReports, updateReportStatus };
