const router = require("express").Router();
const { createReport } = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.post("/", protect, authorizeRoles("student"), createReport);

module.exports = router;
