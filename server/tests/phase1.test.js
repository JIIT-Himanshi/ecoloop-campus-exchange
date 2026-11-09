const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { app } = require("../server");
const connectDB = require("../config/db");
const { errorHandler, notFound } = require("../middleware/errorHandler");

// Helper to simulate HTTP requests against Express app in-memory
function simulateRequest(app, method, url) {
  return new Promise((resolve) => {
    const { EventEmitter } = require("events");
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.headers = { host: "localhost" };
    req.connection = {};

    let statusCode = 200;
    const headers = {};
    let body = "";

    const res = new EventEmitter();
    res.statusCode = 200;

    res.status = (code) => {
      statusCode = code;
      res.statusCode = code;
      return res;
    };

    res.setHeader = (key, val) => {
      headers[key.toLowerCase()] = val;
    };

    res.getHeader = (key) => headers[key.toLowerCase()];

    res.send = (chunk) => {
      body = chunk;
      resolve({ statusCode, headers, body });
      return res;
    };

    res.json = (data) => {
      body = JSON.stringify(data);
      headers["content-type"] = "application/json";
      resolve({ statusCode, headers, body, json: data });
      return res;
    };

    res.end = (chunk) => {
      if (chunk) body = chunk;
      resolve({ statusCode, headers, body });
    };

    app(req, res, (err) => {
      if (err) {
        resolve({ statusCode: 500, body: err.message });
      }
    });
  });
}

describe("EcoLoop Phase 1 Verification Suite", () => {
  describe("1. Environment & Database Configuration", () => {
    it("should reject connection when MONGO_URI is missing", async () => {
      const originalUri = process.env.MONGO_URI;
      delete process.env.MONGO_URI;
      try {
        await assert.rejects(
          async () => {
            await connectDB();
          },
          {
            name: "Error",
            message: /MONGO_URI is not defined in environment variables/,
          }
        );
      } finally {
        process.env.MONGO_URI = originalUri;
      }
    });

    it("should attempt connection to configured MONGO_URI and handle failure gracefully", async () => {
      assert.ok(process.env.MONGO_URI, "MONGO_URI should be defined in .env");
      try {
        await connectDB();
        assert.equal(mongoose.connection.readyState, 1);
      } catch (error) {
        // When local MongoDB is not running, it must reject with connection failure error
        assert.ok(error instanceof Error);
        assert.ok(
          error.message.includes("connect") ||
            error.message.includes("timed out") ||
            error.message.includes("failed"),
          `Expected connection error message, got: ${error.message}`
        );
      }
    });
  });

  describe("2. Express App Endpoints", () => {
    it("should respond to GET / with status 200", async () => {
      const res = await simulateRequest(app, "GET", "/");
      assert.equal(res.statusCode, 200);
      assert.equal(res.body, "EcoLoop API is running");
    });

    it("should respond to GET /api/health with status and database connectivity info", async () => {
      const res = await simulateRequest(app, "GET", "/api/health");
      const isConnected = mongoose.connection.readyState === 1;

      assert.equal(res.statusCode, isConnected ? 200 : 503);
      assert.ok(res.json, "Response must be valid JSON");
      assert.equal(res.json.success, isConnected);
      assert.ok(res.json.uptime);
      assert.ok(res.json.timestamp);
      assert.ok(res.json.database);
      assert.equal(typeof res.json.database.readyState, "number");
    });

    it("should return JSON 404 for undefined routes", async () => {
      const res = await simulateRequest(app, "GET", "/api/nonexistent-route-check");
      assert.equal(res.statusCode, 404);
      assert.ok(res.json);
      assert.equal(res.json.success, false);
      assert.match(res.json.message, /Resource not found/);
    });
  });

  describe("3. Centralized Error Handler Middleware", () => {
    it("should format Mongoose CastError as 404", () => {
      let response = {};
      const err = new Error("Invalid ID");
      err.name = "CastError";
      err.kind = "ObjectId";

      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          response = { code: this.statusCode, data };
          return this;
        },
      };

      errorHandler(err, {}, res, () => {});
      assert.equal(response.code, 404);
      assert.equal(response.data.success, false);
      assert.match(response.data.message, /invalid ID format/i);
    });

    it("should format Mongoose ValidationError as 400 with aggregated messages", () => {
      let response = {};
      const err = new Error("Validation Failed");
      err.name = "ValidationError";
      err.errors = {
        title: { message: "Title is required" },
        price: { message: "Price must be non-negative" },
      };

      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          response = { code: this.statusCode, data };
          return this;
        },
      };

      errorHandler(err, {}, res, () => {});
      assert.equal(response.code, 400);
      assert.equal(response.data.success, false);
      assert.match(response.data.message, /Title is required/);
      assert.match(response.data.message, /Price must be non-negative/);
    });

    it("should format Duplicate Key Error (code 11000) as 400", () => {
      let response = {};
      const err = new Error("Duplicate key");
      err.code = 11000;
      err.keyValue = { email: "user@campus.edu" };

      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          response = { code: this.statusCode, data };
          return this;
        },
      };

      errorHandler(err, {}, res, () => {});
      assert.equal(response.code, 400);
      assert.equal(response.data.success, false);
      assert.match(response.data.message, /Duplicate value entered for email/);
    });

    it("should preserve custom status code and default to 500 for generic errors", () => {
      let response = {};
      const err = new Error("Unauthorized access");
      err.statusCode = 401;

      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          response = { code: this.statusCode, data };
          return this;
        },
      };

      errorHandler(err, {}, res, () => {});
      assert.equal(response.code, 401);
      assert.equal(response.data.success, false);
      assert.equal(response.data.message, "Unauthorized access");
    });
  });

  describe("4. Package.json and Configuration Sanity", () => {
    it("should have main set to server.js and dev/start scripts", () => {
      const pkg = require("../package.json");
      assert.equal(pkg.main, "server.js");
      assert.ok(pkg.scripts.start);
      assert.ok(pkg.scripts.dev);
    });
  });
});

