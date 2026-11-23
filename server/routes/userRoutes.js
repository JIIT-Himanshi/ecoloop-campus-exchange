const router = require("express").Router();
const { getDashboardSummary, updateProfile } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.get("/dashboard", protect, getDashboardSummary);
router.put("/profile", protect, updateProfile);

module.exports = router;
