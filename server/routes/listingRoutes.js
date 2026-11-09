const express = require("express");
const router = express.Router();
const {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
} = require("../controllers/listingController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// All listing routes require student authentication
router.use(protect);

router
  .route("/")
  .post(upload.array("images", 5), createListing)
  .get(getAllListings);

router
  .route("/:id")
  .get(getListingById)
  .put(upload.array("images", 5), updateListing)
  .delete(deleteListing);

module.exports = router;

