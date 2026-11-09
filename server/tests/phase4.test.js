const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { Readable } = require("stream");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { app } = require("../server");
const Listing = require("../models/Listing");
const User = require("../models/User");
const Request = require("../models/Request");
const Transaction = require("../models/Transaction");
const Wishlist = require("../models/Wishlist");

// Helper to simulate in-memory requests
function simulateRequest(app, method, url, { body, headers = {} } = {}) {
  return new Promise((resolve) => {
    let req;
    const reqHeaders = { host: "localhost", ...headers };

    if (body !== undefined) {
      const payload = Buffer.from(JSON.stringify(body));
      req = Readable.from([payload]);
      reqHeaders["content-type"] = "application/json";
      reqHeaders["content-length"] = String(payload.length);
    } else {
      req = Readable.from([]);
    }

    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.headers = reqHeaders;
    req.connection = {};

    let statusCode = 200;
    const resHeaders = {};
    let resBody = "";

    const res = {
      statusCode: 200,
      setHeader(key, val) {
        resHeaders[key.toLowerCase()] = val;
      },
      getHeader(key) {
        return resHeaders[key.toLowerCase()];
      },
      status(code) {
        statusCode = code;
        res.statusCode = code;
        return res;
      },
      send(chunk) {
        resBody = chunk;
        resolve({ statusCode, headers: resHeaders, body: resBody });
        return res;
      },
      json(data) {
        resBody = JSON.stringify(data);
        resHeaders["content-type"] = "application/json";
        resolve({ statusCode, headers: resHeaders, body: resBody, json: data });
        return res;
      },
      end(chunk) {
        if (chunk) resBody = chunk;
        resolve({ statusCode, headers: resHeaders, body: resBody });
      },
    };

    app(req, res, (err) => {
      if (err) {
        resolve({ statusCode: 500, body: err.message });
      }
    });
  });
}

describe("EcoLoop Phase 4: Requests, Transactions & Wishlist Tests", () => {
  const studentAId = new mongoose.Types.ObjectId();
  const studentBId = new mongoose.Types.ObjectId();
  const studentCId = new mongoose.Types.ObjectId();

  const tokenA = jwt.sign({ id: studentAId }, process.env.JWT_SECRET, { expiresIn: "7d" });
  const tokenB = jwt.sign({ id: studentBId }, process.env.JWT_SECRET, { expiresIn: "7d" });
  const tokenC = jwt.sign({ id: studentCId }, process.env.JWT_SECRET, { expiresIn: "7d" });

  let mockUsers = [];
  let mockListings = [];
  let mockRequests = [];
  let mockTransactions = [];
  let mockWishlists = [];

  beforeEach(() => {
    mockUsers = [
      { _id: studentAId, name: "Student A", email: "a@campus.edu", role: "student" },
      { _id: studentBId, name: "Student B", email: "b@campus.edu", role: "student" },
      { _id: studentCId, name: "Student C", email: "c@campus.edu", role: "student" },
    ];
    mockListings = [];
    mockRequests = [];
    mockTransactions = [];
    mockWishlists = [];

    // Mock User.findById for auth
    User.findById = (id) => {
      const found = mockUsers.find((u) => u._id.toString() === id.toString());
      return {
        select: () => Promise.resolve(found || null),
        then: (resolve) => resolve(found || null),
      };
    };

    // Pre-populate listing owned by student A
    const activeListing = new Listing({
      _id: new mongoose.Types.ObjectId(),
      title: "Physics Lab Manual",
      description: "First year physics manual in pristine condition",
      category: "Books",
      listingType: "Sell",
      price: 150,
      condition: "Like New",
      owner: studentAId,
      status: "Active",
    });
    mockListings.push(activeListing);

    // Mock Listing query methods
    Listing.findById = (id) => {
      const match = mockListings.find((l) => l._id.toString() === id.toString());
      if (!match) return { populate: () => Promise.resolve(null), then: (r) => r(null) };
      match.save = async function () { return this; };
      return {
        populate: () => Promise.resolve(match),
        then: (r) => r(match),
      };
    };
    Listing.findByIdAndUpdate = async (id, update) => {
      const match = mockListings.find((l) => l._id.toString() === id.toString());
      if (match) Object.assign(match, update);
      return match;
    };

    // Mock Request methods
    Request.create = async (data) => {
      const doc = new Request(data);
      doc.populate = async function () { return this; };
      doc.save = async function () { return this; };
      mockRequests.push(doc);
      return doc;
    };
    Request.findOne = (query) => {
      const match = mockRequests.find((r) => {
        let matchListing = !query.listing || r.listing.toString() === query.listing.toString();
        let matchRequester = !query.requester || r.requester.toString() === query.requester.toString();
        let matchStatus = true;
        if (query.status && query.status.$in) {
          matchStatus = query.status.$in.includes(r.status);
        }
        return matchListing && matchRequester && matchStatus;
      });
      return {
        populate: () => Promise.resolve(match || null),
        then: (r) => r(match || null),
      };
    };
    Request.findById = (id) => {
      const match = mockRequests.find((r) => r._id.toString() === id.toString());
      if (!match) return { populate: () => Promise.resolve(null), then: (r) => r(null) };
      match.save = async function () { return this; };
      match.populate = async function () { return this; };
      return {
        populate: () => Promise.resolve(match),
        then: (r) => r(match),
      };
    };
    Request.findByIdAndUpdate = async (id, update) => {
      const match = mockRequests.find((r) => r._id.toString() === id.toString());
      if (match) Object.assign(match, update);
      return match;
    };
    Request.find = (query) => {
      let filtered = [...mockRequests];
      if (query.requester) filtered = filtered.filter((r) => r.requester.toString() === query.requester.toString());
      if (query.owner) filtered = filtered.filter((r) => r.owner.toString() === query.owner.toString());
      return {
        populate: function () { return this; },
        sort: function () { return this; },
        skip: function () { return this; },
        limit: function () { return this; },
        then: (r) => r(filtered),
      };
    };
    Request.countDocuments = async (query) => {
      let count = mockRequests.length;
      if (query.requester) count = mockRequests.filter((r) => r.requester.toString() === query.requester.toString()).length;
      if (query.owner) count = mockRequests.filter((r) => r.owner.toString() === query.owner.toString()).length;
      return count;
    };

    // Mock Transaction methods
    Transaction.create = async (data) => {
      const doc = new Transaction(data);
      doc.populate = async function () { return this; };
      doc.save = async function () { return this; };
      mockTransactions.push(doc);
      return doc;
    };
    Transaction.findOne = (query) => {
      const match = mockTransactions.find((t) => {
        let matchListing = !query.listing || t.listing.toString() === query.listing.toString();
        let matchStatus = !query.status || t.status === query.status;
        return matchListing && matchStatus;
      });
      return {
        populate: () => Promise.resolve(match || null),
        then: (r) => r(match || null),
      };
    };
    Transaction.findById = (id) => {
      const match = mockTransactions.find((t) => t._id.toString() === id.toString());
      if (!match) return { populate: () => Promise.resolve(null), then: (r) => r(null) };
      match.save = async function () { return this; };
      match.populate = function () {
        this.requester = mockUsers.find((u) => u._id.toString() === match.requester.toString());
        this.owner = mockUsers.find((u) => u._id.toString() === match.owner.toString());
        return {
          populate: function () { return this; },
          then: (r) => r(match),
        };
      };
      return {
        populate: function () {
          return match.populate();
        },
        then: (r) => r(match),
      };
    };
    Transaction.find = (query) => {
      return {
        populate: function () { return this; },
        sort: function () { return this; },
        skip: function () { return this; },
        limit: function () { return this; },
        then: (r) => r(mockTransactions),
      };
    };
    Transaction.countDocuments = async () => mockTransactions.length;

    // Mock Wishlist methods
    Wishlist.create = async (data) => {
      const doc = new Wishlist(data);
      doc.populate = async function () { return this; };
      doc.deleteOne = async function () {
        mockWishlists = mockWishlists.filter((w) => w._id.toString() !== doc._id.toString());
      };
      mockWishlists.push(doc);
      return doc;
    };
    Wishlist.findOne = (query) => {
      const match = mockWishlists.find((w) => {
        if (query._id && w._id.toString() !== query._id.toString()) return false;
        if (query.user && w.user.toString() !== query.user.toString()) return false;
        if (query.listing && w.listing.toString() !== query.listing.toString()) return false;
        return true;
      });
      if (match) {
        match.deleteOne = async function () {
          mockWishlists = mockWishlists.filter((w) => w._id.toString() !== match._id.toString());
        };
      }
      return {
        populate: () => Promise.resolve(match || null),
        then: (r) => r(match || null),
      };
    };
    Wishlist.find = () => {
      return {
        populate: function () { return this; },
        sort: function () { return this; },
        skip: function () { return this; },
        limit: function () { return this; },
        then: (r) => r(mockWishlists),
      };
    };
    Wishlist.countDocuments = async () => mockWishlists.length;
  });

  describe("1. Request Flow & Ownership Constraints", () => {
    it("should allow Student B to request Student A's active listing", async () => {
      const listing = mockListings[0];
      const res = await simulateRequest(app, "POST", "/api/requests", {
        headers: { authorization: `Bearer ${tokenB}` },
        body: {
          listingId: listing._id,
          message: "Hi, I'm interested in this physics manual!",
        },
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.json.success, true);
      assert.equal(res.json.request.status, "Pending");
      assert.equal(res.json.request.requester.toString(), studentBId.toString());
      assert.equal(res.json.request.owner.toString(), studentAId.toString());
    });

    it("should prevent student from requesting their own listing", async () => {
      const listing = mockListings[0]; // Owned by student A
      const res = await simulateRequest(app, "POST", "/api/requests", {
        headers: { authorization: `Bearer ${tokenA}` }, // Student A requests A's listing
        body: { listingId: listing._id },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.json.message, /cannot request your own listing/i);
    });

    it("should prevent duplicate pending requests from the same student", async () => {
      const listing = mockListings[0];

      // First request
      await simulateRequest(app, "POST", "/api/requests", {
        headers: { authorization: `Bearer ${tokenB}` },
        body: { listingId: listing._id },
      });

      // Second duplicate request
      const res = await simulateRequest(app, "POST", "/api/requests", {
        headers: { authorization: `Bearer ${tokenB}` },
        body: { listingId: listing._id },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.json.message, /already have an active request/i);
    });

    it("should allow Student A (owner) to accept Student B's request, creating a Transaction", async () => {
      const listing = mockListings[0];

      // Student B sends request
      await simulateRequest(app, "POST", "/api/requests", {
        headers: { authorization: `Bearer ${tokenB}` },
        body: { listingId: listing._id },
      });

      const request = mockRequests[0];

      // Student A accepts request
      const res = await simulateRequest(app, "PATCH", `/api/requests/${request._id}/status`, {
        headers: { authorization: `Bearer ${tokenA}` },
        body: { status: "Accepted" },
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.json.request.status, "Accepted");
      assert.equal(listing.status, "Reserved", "Listing must become Reserved");
      assert.ok(res.json.transaction, "A Transaction record must be created");
      assert.equal(res.json.transaction.status, "InProgress");
      assert.equal(res.json.transaction.requesterConfirmed, false);
      assert.equal(res.json.transaction.ownerConfirmed, false);
    });

    it("should prevent non-owner from accepting or rejecting request", async () => {
      const listing = mockListings[0];
      await simulateRequest(app, "POST", "/api/requests", {
        headers: { authorization: `Bearer ${tokenB}` },
        body: { listingId: listing._id },
      });
      const request = mockRequests[0];

      // Student C attempts to accept request
      const res = await simulateRequest(app, "PATCH", `/api/requests/${request._id}/status`, {
        headers: { authorization: `Bearer ${tokenC}` },
        body: { status: "Accepted" },
      });

      assert.equal(res.statusCode, 403);
      assert.match(res.json.message, /not authorized/i);
    });
  });

  describe("2. Two-Party Transaction Completion & Cancellation", () => {
    let activeTransaction;
    let relatedListing;
    let relatedRequest;

    beforeEach(async () => {
      relatedListing = mockListings[0];
      relatedListing.status = "Reserved";

      relatedRequest = new Request({
        _id: new mongoose.Types.ObjectId(),
        listing: relatedListing._id,
        requester: studentBId,
        owner: studentAId,
        status: "Accepted",
      });
      mockRequests.push(relatedRequest);

      activeTransaction = new Transaction({
        _id: new mongoose.Types.ObjectId(),
        listing: relatedListing._id,
        request: relatedRequest._id,
        requester: studentBId,
        owner: studentAId,
        status: "InProgress",
        requesterConfirmed: false,
        ownerConfirmed: false,
      });
      mockTransactions.push(activeTransaction);
    });

    it("should record Student B's confirmation while keeping status InProgress until both confirm", async () => {
      const res = await simulateRequest(
        app,
        "PATCH",
        `/api/transactions/${activeTransaction._id}/confirm`,
        { headers: { authorization: `Bearer ${tokenB}` } }
      );

      assert.equal(res.statusCode, 200);
      assert.equal(res.json.isFullyCompleted, false);
      assert.equal(activeTransaction.requesterConfirmed, true);
      assert.equal(activeTransaction.ownerConfirmed, false);
      assert.equal(activeTransaction.status, "InProgress");
    });

    it("should complete transaction and update listing & request when both parties confirm", async () => {
      // First confirmation by Student B
      await simulateRequest(
        app,
        "PATCH",
        `/api/transactions/${activeTransaction._id}/confirm`,
        { headers: { authorization: `Bearer ${tokenB}` } }
      );

      // Second confirmation by Student A
      const res = await simulateRequest(
        app,
        "PATCH",
        `/api/transactions/${activeTransaction._id}/confirm`,
        { headers: { authorization: `Bearer ${tokenA}` } }
      );

      assert.equal(res.statusCode, 200);
      assert.equal(res.json.isFullyCompleted, true);
      assert.equal(activeTransaction.status, "Completed");
      assert.ok(activeTransaction.completedAt);
      assert.equal(relatedListing.status, "Completed", "Listing must be Completed");
      assert.equal(relatedRequest.status, "Completed", "Request must be Completed");
    });

    it("should allow cancellation of in-progress transaction and restore listing to Active", async () => {
      const res = await simulateRequest(
        app,
        "PATCH",
        `/api/transactions/${activeTransaction._id}/cancel`,
        { headers: { authorization: `Bearer ${tokenB}` } }
      );

      assert.equal(res.statusCode, 200);
      assert.equal(activeTransaction.status, "Cancelled");
      assert.equal(relatedListing.status, "Active", "Listing must revert to Active");
      assert.equal(relatedRequest.status, "Cancelled");
    });
  });

  describe("3. Wishlist Management", () => {
    it("should allow Student B to add active listing to wishlist", async () => {
      const listing = mockListings[0];
      const res = await simulateRequest(app, "POST", "/api/wishlist", {
        headers: { authorization: `Bearer ${tokenB}` },
        body: { listingId: listing._id },
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.json.success, true);
      assert.equal(mockWishlists.length, 1);
    });

    it("should prevent duplicate wishlist entries", async () => {
      const listing = mockListings[0];
      await simulateRequest(app, "POST", "/api/wishlist", {
        headers: { authorization: `Bearer ${tokenB}` },
        body: { listingId: listing._id },
      });

      const res = await simulateRequest(app, "POST", "/api/wishlist", {
        headers: { authorization: `Bearer ${tokenB}` },
        body: { listingId: listing._id },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.json.message, /already in your wishlist/i);
    });

    it("should allow user to remove listing from their wishlist", async () => {
      const listing = mockListings[0];
      await simulateRequest(app, "POST", "/api/wishlist", {
        headers: { authorization: `Bearer ${tokenB}` },
        body: { listingId: listing._id },
      });
      const wishlistItem = mockWishlists[0];

      const res = await simulateRequest(app, "DELETE", `/api/wishlist/${wishlistItem._id}`, {
        headers: { authorization: `Bearer ${tokenB}` },
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.json.success, true);
      assert.equal(mockWishlists.length, 0);
    });
  });
});
