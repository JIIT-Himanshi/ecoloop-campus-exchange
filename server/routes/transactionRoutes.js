const router = require("express").Router();
const { getMyTransactions, confirmTransaction } = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");

router.get("/my-transactions", protect, getMyTransactions);
router.patch("/:id/confirm", protect, confirmTransaction);

module.exports = router;
