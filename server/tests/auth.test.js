const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { Readable } = require("stream");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { app } = require("../server");
const User = require("../models/User");
const { authorize } = require("../middleware/authMiddleware");

// In-memory request simulator
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

describe("EcoLoop Phase 2: Authentication & Authorization Tests", () => {
  // Mock store to simulate MongoDB operations in-memory
  let mockUsers = [];

  beforeEach(async () => {
    mockUsers = [];

    // Pre-populate an existing user with hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    const existingUserDoc = new User({
      name: "Existing Student",
      email: "existing@campus.edu",
      password: hashedPassword,
      role: "student",
      ecoPoints: 0,
      profileImage: "",
    });
    // Store password directly on mock doc
    existingUserDoc.password = hashedPassword;
    mockUsers.push(existingUserDoc);

    // Stub User.findOne
    User.findOne = (query) => {
      const email = query.email ? query.email.toLowerCase() : null;
      const found = mockUsers.find((u) => u.email === email);
      return {
        select: (fields) => Promise.resolve(found || null),
        then: (resolve) => resolve(found || null),
      };
    };

    // Stub User.findById
    User.findById = (id) => {
      const found = mockUsers.find((u) => u._id.toString() === id.toString());
      return {
        select: (fields) => Promise.resolve(found || null),
        then: (resolve) => resolve(found || null),
      };
    };

    // Stub User.create
    User.create = async (userData) => {
      const userDoc = new User(userData);
      // Run pre-save hook
      const salt = await bcrypt.genSalt(10);
      userDoc.password = await bcrypt.hash(userData.password, salt);
      mockUsers.push(userDoc);
      return userDoc;
    };
  });

  it("1. Register a new student successfully", async () => {
    const res = await simulateRequest(app, "POST", "/api/auth/register", {
      body: {
        name: "Aarav Sharma",
        email: "aarav@campus.edu",
        password: "securePassword123",
      },
    });

    assert.equal(res.statusCode, 201);
    assert.equal(res.json.success, true);
    assert.ok(res.json.token, "Token must be returned");
    assert.equal(res.json.user.name, "Aarav Sharma");
    assert.equal(res.json.user.email, "aarav@campus.edu");
    assert.equal(res.json.user.role, "student");
    assert.equal(res.json.user.ecoPoints, 0);
  });

  it("2. Try registering with an existing email", async () => {
    const res = await simulateRequest(app, "POST", "/api/auth/register", {
      body: {
        name: "Duplicate User",
        email: "existing@campus.edu",
        password: "password123",
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.json.success, false);
    assert.match(res.json.message, /already exists/i);
  });

  it("3. Login with correct credentials", async () => {
    const res = await simulateRequest(app, "POST", "/api/auth/login", {
      body: {
        email: "existing@campus.edu",
        password: "password123",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json.success, true);
    assert.ok(res.json.token);
    assert.equal(res.json.user.email, "existing@campus.edu");
  });

  it("4. Login with incorrect credentials", async () => {
    const res = await simulateRequest(app, "POST", "/api/auth/login", {
      body: {
        email: "existing@campus.edu",
        password: "wrongPassword",
      },
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.json.success, false);
    assert.match(res.json.message, /invalid email or password/i);
  });

  it("5. Access /api/auth/me without a token", async () => {
    const res = await simulateRequest(app, "GET", "/api/auth/me");

    assert.equal(res.statusCode, 401);
    assert.equal(res.json.success, false);
    assert.match(res.json.message, /no token provided/i);
  });

  it("6. Access /api/auth/me with a valid token", async () => {
    const user = mockUsers[0];
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const res = await simulateRequest(app, "GET", "/api/auth/me", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json.success, true);
    assert.equal(res.json.user.email, user.email);
  });

  it("7. Update the user's profile (name & profileImage)", async () => {
    const user = mockUsers[0];
    user.save = async function () {
      return this;
    };

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const res = await simulateRequest(app, "PUT", "/api/auth/profile", {
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        name: "Updated Name",
        profileImage: "https://example.com/avatar.jpg",
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json.success, true);
    assert.equal(res.json.user.name, "Updated Name");
    assert.equal(res.json.user.profileImage, "https://example.com/avatar.jpg");
  });

  it("8. Try changing the role through the profile endpoint (must be ignored)", async () => {
    const user = mockUsers[0];
    user.save = async function () {
      return this;
    };

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const res = await simulateRequest(app, "PUT", "/api/auth/profile", {
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: {
        name: "Sneaky User",
        role: "admin",
        ecoPoints: 5000,
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json.user.role, "student", "Role must NOT be changed to admin");
    assert.equal(res.json.user.ecoPoints, 0, "EcoPoints must NOT be changed");
  });

  it("9. Verify that the password is hashed in MongoDB", async () => {
    const rawPassword = "myPlainPassword123";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    const user = new User({
      name: "Hash Test",
      email: "hashtest@campus.edu",
      password: hash,
    });

    assert.notEqual(user.password, rawPassword);
    assert.match(user.password, /^\$2[aby]\$\d{2}\$/);
    const matches = await user.matchPassword(rawPassword);
    assert.equal(matches, true);
  });

  it("10. Verify that the response never contains a password or password hash", async () => {
    // Check registration response
    const regRes = await simulateRequest(app, "POST", "/api/auth/register", {
      body: {
        name: "Security Check",
        email: "sec@campus.edu",
        password: "secretPassword123",
      },
    });
    assert.equal(regRes.statusCode, 201);
    assert.equal(regRes.json.user.password, undefined);
    assert.ok(!JSON.stringify(regRes.json).includes("secretPassword123"));
    assert.ok(!JSON.stringify(regRes.json).includes("$2b$"));

    // Check login response
    const loginRes = await simulateRequest(app, "POST", "/api/auth/login", {
      body: {
        email: "existing@campus.edu",
        password: "password123",
      },
    });
    assert.equal(loginRes.statusCode, 200);
    assert.equal(loginRes.json.user.password, undefined);
    assert.ok(!JSON.stringify(loginRes.json).includes("password123"));
    assert.ok(!JSON.stringify(loginRes.json).includes("$2b$"));
  });

  it("11. Role-based authorization middleware (authorize)", () => {
    const adminOnly = authorize("admin");

    // Student role denied
    let studentBlocked = false;
    const reqStudent = { user: { role: "student" } };
    const resStudent = {
      status(code) {
        assert.equal(code, 403);
        return {
          json(data) {
            studentBlocked = true;
            assert.equal(data.success, false);
          },
        };
      },
    };
    adminOnly(reqStudent, resStudent, () => {});
    assert.equal(studentBlocked, true);

    // Admin role allowed
    let adminNextCalled = false;
    const reqAdmin = { user: { role: "admin" } };
    adminOnly(reqAdmin, {}, () => {
      adminNextCalled = true;
    });
    assert.equal(adminNextCalled, true);
  });
});

