const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const listingId = "64b000000000000000000001";
const createdReports = [];
let listingLookupCount = 0;

const listingModel = {
  findById(id) {
    listingLookupCount += 1;
    return {
      select: async () => (id === listingId ? { _id: listingId } : null),
    };
  },
};

const reportModel = {
  async create(report) {
    createdReports.push(report);
    return { _id: "64b000000000000000000002", ...report };
  },
};

const controllerPath = path.resolve(__dirname, "../controllers/reportController.js");
const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (parent && parent.filename === controllerPath) {
    if (request === "../models/Listing") return listingModel;
    if (request === "../models/Report") return reportModel;
  }
  return originalLoad.call(this, request, parent, isMain);
};

let createReport;
try {
  ({ createReport } = require(controllerPath));
} finally {
  Module._load = originalLoad;
}

const invoke = async (body) => {
  let statusCode = 200;
  let responseBody;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      responseBody = payload;
      return this;
    },
  };

  await createReport(
    { body, user: { id: "64b000000000000000000003" } },
    response,
    (error) => {
      throw error;
    }
  );
  return { statusCode, responseBody };
};

test("creates a trimmed report linked to an existing listing", async () => {
  createdReports.length = 0;
  const response = await invoke({
    subject: "  Listing concern  ",
    description: "  Please review this listing.  ",
    listingId,
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.responseBody.report.subject, "Listing concern");
  assert.equal(response.responseBody.report.description, "Please review this listing.");
  assert.equal(createdReports[0].listing, listingId);
  assert.equal(createdReports[0].reporter, "64b000000000000000000003");
});

test("rejects missing, oversized, or invalid listing data without creating a report", async () => {
  createdReports.length = 0;
  listingLookupCount = 0;

  const responses = await Promise.all([
    invoke({ subject: " ", description: "Details" }),
    invoke({ subject: "x".repeat(121), description: "Details" }),
    invoke({ subject: "Concern", description: "x".repeat(1501) }),
    invoke({ subject: "Concern", description: "Details", listingId: "invalid" }),
  ]);

  assert.deepEqual(responses.map((response) => response.statusCode), [400, 400, 400, 400]);
  assert.equal(createdReports.length, 0);
  assert.equal(listingLookupCount, 0);
});
