const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { Readable } = require("stream");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { app } = require("../server");
const Listing = require("../models/Listing");
const User = require("../models/User");

// Helper to simulate HTTP requests in-memory
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

describe("EcoLoop Phase 3: Resource Listing, Search & Filter Tests", () => {
  const student1Id = new mongoose.Types.ObjectId();
  const student2Id = new mongoose.Types.ObjectId();

  const student1Token = jwt.sign({ id: student1Id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  const student2Token = jwt.sign({ id: student2Id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  let mockListings = [];

  beforeEach(() => {
    mockListings = [];

    // Mock User.findById for authMiddleware
    User.findById = (id) => {
      const idStr = id.toString();
      const userDoc = {
        _id: new mongoose.Types.ObjectId(idStr),
        name: idStr === student1Id.toString() ? "Student One" : "Student Two",
        email: idStr === student1Id.toString() ? "student1@campus.edu" : "student2@campus.edu",
        role: "student",
        profileImage: "",
        ecoPoints: 0,
      };
      return {
        select: () => Promise.resolve(userDoc),
        then: (resolve) => resolve(userDoc),
      };
    };

    // Pre-populate some listings
    const listing1 = new Listing({
      _id: new mongoose.Types.ObjectId(),
      title: "Data Structures and Algorithms Textbook",
      description: "Standard DSA textbook in great condition, McGraw Hill",
      category: "Books",
      listingType: "Sell",
      price: 350,
      condition: "Like New",
      images: ["https://example.com/dsa.jpg"],
      owner: student1Id,
      status: "Active",
      createdAt: new Date("2026-01-01"),
    });

    const listing2 = new Listing({
      _id: new mongoose.Types.ObjectId(),
      title: "Scientific Calculator FX-991ES",
      description: "Casio scientific calculator, works perfectly",
      category: "Electronics",
      listingType: "Donate",
      price: 0,
      condition: "Good",
      images: [],
      owner: student2Id,
      status: "Active",
      createdAt: new Date("2026-01-02"),
    });

    mockListings.push(listing1, listing2);

    // Mock Listing.create
    Listing.create = async (docData) => {
      const newListing = new Listing(docData);
      newListing.populate = async function () {
        this.owner = {
          _id: student1Id,
          name: "Student One",
          profileImage: "",
          email: "student1@campus.edu",
        };
        return this;
      };
      mockListings.push(newListing);
      return newListing;
    };

    // Mock Listing.find with chainable query methods
    Listing.find = (query = {}) => {
      let filtered = [...mockListings];

      if (query.status) {
        filtered = filtered.filter((l) => l.status === query.status);
      }
      if (query.category) {
        filtered = filtered.filter((l) => l.category === query.category);
      }
      if (query.listingType) {
        filtered = filtered.filter((l) => l.listingType === query.listingType);
      }
      if (query.condition) {
        filtered = filtered.filter((l) => l.condition === query.condition);
      }
      if (query.$or) {
        filtered = filtered.filter((l) => {
          return query.$or.some((clause) => {
            if (clause.title) return clause.title.test(l.title);
            if (clause.description) return clause.description.test(l.description);
            return false;
          });
        });
      }
      if (query.price) {
        if (query.price.$gte !== undefined) {
          filtered = filtered.filter((l) => l.price >= query.price.$gte);
        }
        if (query.price.$lte !== undefined) {
          filtered = filtered.filter((l) => l.price <= query.price.$lte);
        }
      }

      return {
        populate: function () {
          return this;
        },
        sort: function (sortOpt) {
          if (sortOpt.price === 1) {
            filtered.sort((a, b) => a.price - b.price);
          } else if (sortOpt.price === -1) {
            filtered.sort((a, b) => b.price - a.price);
          } else {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          }
          return this;
        },
        skip: function (num) {
          filtered = filtered.slice(num);
          return this;
        },
        limit: function (num) {
          filtered = filtered.slice(0, num);
          return this;
        },
        then: function (resolve) {
          resolve(filtered);
        },
      };
    };

    // Mock Listing.countDocuments
    Listing.countDocuments = async (query = {}) => {
      let count = mockListings.length;
      if (query.status) {
        count = mockListings.filter((l) => l.status === query.status).length;
      }
      return count;
    };

    // Mock Listing.findById
    Listing.findById = (id) => {
      const match = mockListings.find((l) => l._id.toString() === id.toString());
      if (!match) {
        return {
          populate: () => Promise.resolve(null),
          then: (resolve) => resolve(null),
        };
      }
      match.save = async function () {
        return this;
      };
      match.populate = async function () {
        this.owner = {
          _id: match.owner,
          name: "Owner Name",
          email: "owner@campus.edu",
        };
        return this;
      };
      return {
        populate: () => Promise.resolve(match),
        then: (resolve) => resolve(match),
      };
    };
  });

  describe("1. Model Validation & Integrity", () => {
    it("should reject listing with missing required fields", async () => {
      const invalidListing = new Listing({});
      await assert.rejects(async () => {
        await invalidListing.validate();
      }, /Listing title is required/);
    });

    it("should reject invalid listingType", async () => {
      const listing = new Listing({
        title: "Test Item",
        description: "Test desc",
        category: "Books",
        listingType: "Rent", // Invalid
        condition: "Good",
        owner: student1Id,
      });
      await assert.rejects(async () => {
        await listing.validate();
      }, /Listing type must be Sell, Exchange, or Donate/);
    });

    it("should reject negative price", async () => {
      const listing = new Listing({
        title: "Test Item",
        description: "Test desc",
        category: "Books",
        listingType: "Sell",
        price: -50, // Negative
        condition: "Good",
        owner: student1Id,
      });
      await assert.rejects(async () => {
        await listing.validate();
      }, /Price cannot be negative/);
    });
  });

  describe("2. Authentication Requirement", () => {
    it("should reject unauthenticated request to /api/listings with 401", async () => {
      const res = await simulateRequest(app, "GET", "/api/listings");
      assert.equal(res.statusCode, 401);
      assert.equal(res.json.success, false);
      assert.match(res.json.message, /no token provided/i);
    });
  });

  describe("3. Create Listing Endpoint", () => {
    it("should create a listing when authenticated as a student", async () => {
      const res = await simulateRequest(app, "POST", "/api/listings", {
        headers: { authorization: `Bearer ${student1Token}` },
        body: {
          title: "Lab Coat & Safety Goggles",
          description: "Chemistry lab coat size M, goggles included",
          category: "Lab Equipment",
          listingType: "Sell",
          price: 250,
          condition: "Good",
          images: ["https://example.com/labcoat.jpg"],
        },
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.json.success, true);
      assert.equal(res.json.listing.title, "Lab Coat & Safety Goggles");
      assert.equal(res.json.listing.price, 250);
      assert.equal(res.json.listing.status, "Active");
      assert.ok(res.json.listing.owner);
    });

    it("should enforce price=0 when listingType is Donate", async () => {
      const res = await simulateRequest(app, "POST", "/api/listings", {
        headers: { authorization: `Bearer ${student1Token}` },
        body: {
          title: "Free Notebooks",
          description: "Unused spiral notebooks",
          category: "Stationery",
          listingType: "Donate",
          price: 999, // Should be forced to 0
          condition: "New",
        },
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.json.listing.price, 0);
    });

    it("should reject Sell listing when price is missing", async () => {
      const res = await simulateRequest(app, "POST", "/api/listings", {
        headers: { authorization: `Bearer ${student1Token}` },
        body: {
          title: "Engineering Drawing Board",
          description: "Full size board with T-square",
          category: "Stationery",
          listingType: "Sell",
          condition: "Good",
        },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.json.message, /Price is required for Sell listings/);
    });
  });

  describe("4. Get Listings & Search/Filter/Sort", () => {
    it("should get all active listings with pagination metadata", async () => {
      const res = await simulateRequest(app, "GET", "/api/listings?page=1&limit=5", {
        headers: { authorization: `Bearer ${student1Token}` },
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.json.success, true);
      assert.ok(Array.isArray(res.json.listings));
      assert.equal(res.json.page, 1);
      assert.equal(res.json.limit, 5);
      assert.ok(typeof res.json.totalListings === "number");
      assert.ok(typeof res.json.totalPages === "number");
    });

    it("should filter listings by category", async () => {
      const res = await simulateRequest(
        app,
        "GET",
        "/api/listings?category=Books",
        { headers: { authorization: `Bearer ${student1Token}` } }
      );

      assert.equal(res.statusCode, 200);
      assert.ok(res.json.listings.every((l) => l.category === "Books"));
    });

    it("should search listings by keyword in title/description", async () => {
      const res = await simulateRequest(
        app,
        "GET",
        "/api/listings?search=calculator",
        { headers: { authorization: `Bearer ${student1Token}` } }
      );

      assert.equal(res.statusCode, 200);
      assert.equal(res.json.listings.length, 1);
      assert.match(res.json.listings[0].title, /calculator/i);
    });

    it("should sort listings by price ascending", async () => {
      const res = await simulateRequest(
        app,
        "GET",
        "/api/listings?sort=price_asc",
        { headers: { authorization: `Bearer ${student1Token}` } }
      );

      assert.equal(res.statusCode, 200);
      const prices = res.json.listings.map((l) => l.price);
      for (let i = 0; i < prices.length - 1; i++) {
        assert.ok(prices[i] <= prices[i + 1]);
      }
    });
  });

  describe("5. Update and Delete Listings (Ownership Controls)", () => {
    it("should allow owner to update their own listing", async () => {
      const targetListing = mockListings[0];
      const res = await simulateRequest(
        app,
        "PUT",
        `/api/listings/${targetListing._id}`,
        {
          headers: { authorization: `Bearer ${student1Token}` },
          body: {
            title: "Updated Textbook Title",
            price: 300,
          },
        }
      );

      assert.equal(res.statusCode, 200);
      assert.equal(res.json.success, true);
      assert.equal(res.json.listing.title, "Updated Textbook Title");
      assert.equal(res.json.listing.price, 300);
    });

    it("should forbid non-owner from updating someone else's listing", async () => {
      const targetListing = mockListings[0]; // Owned by student 1
      const res = await simulateRequest(
        app,
        "PUT",
        `/api/listings/${targetListing._id}`,
        {
          headers: { authorization: `Bearer ${student2Token}` }, // Request from student 2
          body: { title: "Hacked Title" },
        }
      );

      assert.equal(res.statusCode, 403);
      assert.equal(res.json.success, false);
      assert.match(res.json.message, /not authorized/i);
    });

    it("should soft delete listing by updating status to Removed", async () => {
      const targetListing = mockListings[0];
      const res = await simulateRequest(
        app,
        "DELETE",
        `/api/listings/${targetListing._id}`,
        {
          headers: { authorization: `Bearer ${student1Token}` },
        }
      );

      assert.equal(res.statusCode, 200);
      assert.equal(res.json.success, true);
      assert.equal(targetListing.status, "Removed");
    });
  });
});

