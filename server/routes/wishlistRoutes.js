const express = require("express");
const router = express.Router();
const {
  addToWishlist,
  getMyWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");
const { protect } = require("../middleware/authMiddleware");

// All wishlist routes require student authentication
router.use(protect);

router.post("/", addToWishlist);
router.get("/", getMyWishlist);
router.delete("/:id", removeFromWishlist);

module.exports = router;

