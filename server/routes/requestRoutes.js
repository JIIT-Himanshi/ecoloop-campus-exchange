const router = require("express").Router();
const { sendRequest, getSentRequests, getReceivedRequests, updateRequestStatus } = require("../controllers/requestController");
const { protect } = require("../middleware/authMiddleware");

router.post("/:listingId", protect, sendRequest);
router.get("/sent", protect, getSentRequests);
router.get("/received", protect, getReceivedRequests);
router.patch("/:id/status", protect, updateRequestStatus);

module.exports = router;
