const express = require("express");
const router = express.Router();
const {
  getMyTransactions,
  getTransactionById,
  confirmCompletion,
  cancelTransaction,
} = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");

// All transaction routes require student authentication
router.use(protect);

router.get("/", getMyTransactions);
router.get("/:id", getTransactionById);
router.patch("/:id/confirm", confirmCompletion);
router.patch("/:id/cancel", cancelTransaction);

module.exports = router;

