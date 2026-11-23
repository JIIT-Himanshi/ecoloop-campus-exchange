const router = require("express").Router();
const { getListings, createListing, getMyListings, getListingById, updateListing, deleteListing } = require("../controllers/listingController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const validateListing = require("../middleware/validateListing");

router.get("/", getListings);
router.post("/", protect, upload.single("image"), validateListing, createListing);
router.get("/my-listings", protect, getMyListings);
router.get("/:id", getListingById);
router.put("/:id", protect, upload.single("image"), updateListing);
router.delete("/:id", protect, deleteListing);

module.exports = router;
