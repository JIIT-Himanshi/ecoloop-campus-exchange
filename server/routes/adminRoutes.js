const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
  getDashboardStats, getAdminListings, updateListingStatus, deleteAdminListing,
  getUsers, updateUserStatus, getReports, updateReportStatus,
} = require("../controllers/adminController");

router.use(protect, authorizeRoles("admin"));
router.get("/dashboard", getDashboardStats);
router.get("/listings", getAdminListings);
router.patch("/listings/:id/status", updateListingStatus);
router.delete("/listings/:id", deleteAdminListing);
router.get("/users", getUsers);
router.patch("/users/:id/status", updateUserStatus);
router.get("/reports", getReports);
router.patch("/reports/:id/status", updateReportStatus);

module.exports = router;
