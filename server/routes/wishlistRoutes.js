const router = require("express").Router();
const { getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlistController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getWishlist);
router.post("/", protect, addToWishlist);
router.delete("/:listingId", protect, removeFromWishlist);

module.exports = router;
