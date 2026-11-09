const express = require("express");
const router = express.Router();
const {
  createRequest,
  getMySentRequests,
  getIncomingRequests,
  updateRequestStatus,
  cancelRequest,
} = require("../controllers/requestController");
const { protect } = require("../middleware/authMiddleware");

// All request routes require student authentication
router.use(protect);

router.post("/", createRequest);
router.get("/sent", getMySentRequests);
router.get("/received", getIncomingRequests);
router.patch("/:id/status", updateRequestStatus);
router.patch("/:id/cancel", cancelRequest);

module.exports = router;

