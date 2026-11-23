const Transaction = require("../models/Transaction");
const Request = require("../models/Request");
const Listing = require("../models/Listing");
const User = require("../models/User");
const Notification = require("../models/Notification");
const calculateEcoPoints = require("../utils/calculateEcoPoints");

const getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ owner: req.user.id }, { requester: req.user.id }],
    })
      .populate("listing", "title type category price imageUrl")
      .populate("owner", "name")
      .populate("requester", "name")
      .sort({ createdAt: -1 });

    const result = transactions.map((transaction) => {
      const item = transaction.toObject();
      item.currentUserConfirmed =
        String(transaction.owner._id) === req.user.id
          ? transaction.ownerConfirmed
          : transaction.requesterConfirmed;
      return item;
    });
    res.json({ transactions: result });
  } catch (error) { next(error); }
};

const confirmTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found." });
    if (transaction.status === "Completed") return res.status(400).json({ message: "This transaction is already completed." });

    const isOwner = String(transaction.owner) === req.user.id;
    const isRequester = String(transaction.requester) === req.user.id;
    if (!isOwner && !isRequester) return res.status(403).json({ message: "You are not part of this transaction." });

    const confirmationField = isOwner ? "ownerConfirmed" : "requesterConfirmed";
    await Transaction.updateOne(
      { _id: transaction._id, status: "In Progress" },
      { $set: { [confirmationField]: true } }
    );

    const updated = await Transaction.findById(transaction._id);
    if (updated.ownerConfirmed && updated.requesterConfirmed) {
      // Atomic claim: only one concurrent request can change this transaction to Completed
      // and award the points. This prevents duplicate EcoPoints.
      const completed = await Transaction.findOneAndUpdate(
        {
          _id: updated._id,
          status: "In Progress",
          ecoPointsAwarded: false,
          ownerConfirmed: true,
          requesterConfirmed: true,
        },
        {
          $set: {
            status: "Completed",
            completedAt: new Date(),
            ecoPointsAwarded: true,
          },
        },
        { new: true }
      );

      if (completed) {
        const points = calculateEcoPoints(completed.type);
        await User.updateMany(
          { _id: { $in: [completed.owner, completed.requester] } },
          { $inc: { ecoPoints: points } }
        );
        await Request.findByIdAndUpdate(completed.request, { status: "Completed" });
        await Listing.findByIdAndUpdate(completed.listing, { status: "Completed" });
        await Notification.insertMany([
          {
            recipient: completed.owner,
            title: "Transaction completed",
            message: `Your transaction is complete. You earned ${points} EcoPoints.`,
            relatedId: completed._id,
            relatedType: "Transaction",
          },
          {
            recipient: completed.requester,
            title: "Transaction completed",
            message: `Your transaction is complete. You earned ${points} EcoPoints.`,
            relatedId: completed._id,
            relatedType: "Transaction",
          },
        ]);
        return res.json({
          message: "Transaction completed. EcoPoints awarded to both students.",
          transaction: completed,
        });
      }
    }

    res.json({
      message: "Your confirmation has been recorded. Waiting for the other student.",
      transaction: updated,
    });
  } catch (error) { next(error); }
};

module.exports = { getMyTransactions, confirmTransaction };
