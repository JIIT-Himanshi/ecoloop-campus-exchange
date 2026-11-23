const User = require("../models/User");
const Listing = require("../models/Listing");
const Request = require("../models/Request");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [
      activeListings,
      sentRequests,
      receivedRequests,
      completedTransactions,
      recentNotifications,
    ] = await Promise.all([
      Listing.countDocuments({ owner: userId, status: "Active" }),
      Request.countDocuments({ requester: userId, status: "Pending" }),
      Request.countDocuments({ owner: userId, status: "Pending" }),
      Transaction.countDocuments({
        $or: [{ requester: userId }, { owner: userId }],
        status: "Completed",
      }),
      Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      stats: {
        activeListings,
        sentRequests,
        receivedRequests,
        completedTransactions,
        ecoPoints: req.user.user.ecoPoints || 0,
      },
      recentNotifications,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Name is required." });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true, runValidators: true }
    ).select("_id name email studentId role ecoPoints isActive");

    res.json({ message: "Profile updated successfully.", user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardSummary, updateProfile };
