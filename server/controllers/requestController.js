const Request = require("../models/Request");
const Listing = require("../models/Listing");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");

const sendRequest = async (req, res, next) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.listingId, status: "Active" });
    if (!listing) return res.status(404).json({ message: "Listing not found." });
    if (String(listing.owner) === req.user.id) return res.status(400).json({ message: "You cannot request your own listing." });

    const existing = await Request.findOne({ listing: listing._id, requester: req.user.id });
    if (existing && ["Pending", "Accepted"].includes(existing.status)) {
      return res.status(409).json({ message: "You already have an active request for this listing." });
    }
    const request = existing
      ? await Request.findByIdAndUpdate(existing._id, { status: "Pending", owner: listing.owner }, { new: true })
      : await Request.create({ listing: listing._id, requester: req.user.id, owner: listing.owner, message: req.body.message || "" });

    await Notification.create({
      recipient: listing.owner,
      title: "New listing request",
      message: "A student has requested one of your listings.",
      relatedId: request._id,
      relatedType: "Request",
    });
    res.status(201).json({ message: "Request sent successfully.", request });
  } catch (error) { next(error); }
};

const getSentRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ requester: req.user.id })
      .populate("listing", "title type category price imageUrl")
      .populate("owner", "name")
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) { next(error); }
};

const getReceivedRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ owner: req.user.id })
      .populate("listing", "title type category price imageUrl")
      .populate("requester", "name")
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) { next(error); }
};

const updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["Accepted", "Rejected", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid request status." });
    }
    const request = await Request.findById(req.params.id).populate("listing");
    if (!request) return res.status(404).json({ message: "Request not found." });

    const isOwner = String(request.owner) === req.user.id;
    const isRequester = String(request.requester) === req.user.id;
    if ((status === "Accepted" || status === "Rejected") && !isOwner) return res.status(403).json({ message: "Only the listing owner can respond." });
    if (status === "Cancelled" && !isRequester) return res.status(403).json({ message: "Only the requester can cancel." });
    if (request.status !== "Pending") return res.status(400).json({ message: "This request is no longer pending." });

    request.status = status;
    await request.save();

    if (status === "Accepted") {
      await Transaction.create({
        request: request._id,
        listing: request.listing._id,
        owner: request.owner,
        requester: request.requester,
        type: request.listing.type,
      });
      await Listing.findByIdAndUpdate(request.listing._id, { status: "Inactive" });
    }

    const recipient = isOwner ? request.requester : request.owner;
    await Notification.create({
      recipient,
      title: `Request ${status.toLowerCase()}`,
      message: `Your listing request was ${status.toLowerCase()}.`,
      relatedId: request._id,
      relatedType: "Request",
    });

    res.json({ message: `Request ${status.toLowerCase()}.`, request });
  } catch (error) { next(error); }
};

module.exports = { sendRequest, getSentRequests, getReceivedRequests, updateRequestStatus };
