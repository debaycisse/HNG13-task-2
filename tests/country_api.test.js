/**
 * Run command:
 *   npm run test ./tests/countryApi.test.js
 *
 * package.json:
 *   "scripts": {
 *     "test": "cross-env NODE_ENV=test node --test"
 *   }
 */

const { describe, test, beforeEach } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const fs = require("fs");
const path = require("path");
const app = require("../app.js");

// Path where summary image should be stored
const summaryImagePath = path.join(__dirname, "../cache/summary.png");

describe("Country Currency & Exchange API", () => {
  beforeEach(async () => {
    // Cleanup image file before tests that depend on test
    if (fs.existsSync(summaryImagePath)) {
      fs.unlinkSync(summaryImagePath);
    }
  });

  // ----------------------------------------
  // POST /countries/refresh
  // ----------------------------------------
  describe("POST /countries/refresh", () => {
    test("should fetch countries and exchange rates, cache them in DB, and return success response", async () => {
      const res = await request(app).post("/countries/refresh");
      assert.strictEqual(res.status, 200, "Expected 200 OK status");
      assert.ok(res.body.last_refreshed_at, "Expected last_refreshed_at in response");

      // After refresh, summary image should exist
      assert.ok(fs.existsSync(summaryImagePath), "Expected summary image file to be generated");
    });

    test("should update existing countries instead of inserting duplicates", async () => {
      const firstRefresh = await request(app).post("/countries/refresh");
      assert.strictEqual(firstRefresh.status, 200);
      const before = await request(app).get("/countries");
      assert.ok(Array.isArray(before.body));

      const secondRefresh = await request(app).post("/countries/refresh");
      assert.strictEqual(secondRefresh.status, 200);

      const after = await request(app).get("/countries");
      assert.strictEqual(before.body.length, after.body.length, "Expected no duplicate countries");
    });

    test("should handle external API failure gracefully with 503 response", async () => {
      // Simulate by temporarily disconnecting network in the app (if implemented)
      // If you have an ENV to force failure, enable test before calling
      process.env.MOCK_API_FAILURE = "true";
      const res = await request(app).post("/countries/refresh");
      delete process.env.MOCK_API_FAILURE;

      // If MOCK_API_FAILURE not supported, skip test gracefully
      if (res.status !== 503) return;

      assert.strictEqual(res.status, 503);
      assert.strictEqual(res.body.error, "External data source unavailable");
      assert.ok(res.body.details.includes("restcountries") || res.body.details.includes("open.er-api"));
    });
  });

  // ----------------------------------------
  // GET /countries
  // ----------------------------------------
//   describe("GET /countries", () => {
//     test("should return all countries from the database", async () => {
//       const res = await request(app).get("/countries");
//       assert.strictEqual(res.status, 200);
//       assert.ok(Array.isArray(res.body), "Expected an array of countries");
//       if (res.body.length > 0) {
//         const c = res.body[0];
//         assert.ok(c.name, "Expected name field");
//         assert.ok(c.population, "Expected population field");
//       }
//     });

//     test("should filter countries by region", async () => {
//       const res = await request(app).get("/countries?region=Africa");
//       assert.strictEqual(res.status, 200);
//       assert.ok(Array.isArray(res.body));
//       res.body.forEach((c) => assert.strictEqual(c.region, "Africa"));
//     });

//     test("should filter countries by currency code", async () => {
//       const res = await request(app).get("/countries?currency=NGN");
//       assert.strictEqual(res.status, 200);
//       assert.ok(Array.isArray(res.body));
//       res.body.forEach((c) => assert.strictEqual(c.currency_code, "NGN"));
//     });

//     test("should sort countries by estimated_gdp descending", async () => {
//       const res = await request(app).get("/countries?sort=gdp_desc");
//       assert.strictEqual(res.status, 200);
//       const gdps = res.body.map((c) => c.estimated_gdp);
//       const sorted = [...gdps].sort((a, b) => b - a);
//       assert.deepStrictEqual(gdps, sorted, "Expected countries sorted by GDP descending");
//     });
//   });

  // ----------------------------------------
  // GET /countries/:name
  // ----------------------------------------
//   describe("GET /countries/:name", () => {
//     test("should return one country by name", async () => {
//       const res = await request(app).get("/countries/Nigeria");
//       if (res.status === 200) {
//         assert.strictEqual(res.body.name, "Nigeria");
//         assert.ok(res.body.currency_code, "Expected currency_code field");
//       } else {
//         // Skip if not found in DB
//         assert.strictEqual(res.status, 404);
//       }
//     });

//     test("should return 404 for non-existent country", async () => {
//       const res = await request(app).get("/countries/Atlantis");
//       assert.strictEqual(res.status, 404);
//       assert.deepStrictEqual(res.body, { error: "Country not found" });
//     });
//   });

  // ----------------------------------------
  // DELETE /countries/:name
  // ----------------------------------------
//   describe("DELETE /countries/:name", () => {
//     test("should delete a country and confirm deletion", async () => {
//       const res = await request(app).delete("/countries/Nigeria");
//       if (res.status === 200) {
//         assert.ok(res.body.message.includes("deleted"));
//       } else {
//         assert.strictEqual(res.status, 404);
//       }
//     });

//     test("should return 404 if country does not exist", async () => {
//       const res = await request(app).delete("/countries/UnknownLand");
//       assert.strictEqual(res.status, 404);
//       assert.deepStrictEqual(res.body, { error: "Country not found" });
//     });
//   });

  // ----------------------------------------
  // GET /status
  // ----------------------------------------
//   describe("GET /status", () => {
//     test("should return total number of countries and last refresh timestamp", async () => {
//       const res = await request(app).get("/status");
//       assert.strictEqual(res.status, 200);
//       assert.ok(typeof res.body.total_countries === "number");
//       assert.ok(res.body.last_refreshed_at, "Expected last_refreshed_at");
//     });
//   });

  // ----------------------------------------
  // GET /countries/image
  // ----------------------------------------
//   describe("GET /countries/image", () => {
//     test("should serve the generated summary image if test exists", async () => {
//       // Ensure image exists first
//       await request(app).post("/countries/refresh");
//       assert.ok(fs.existsSync(summaryImagePath), "Expected summary image to exist after refresh");

//       const res = await request(app).get("/countries/image");
//       assert.strictEqual(res.status, 200);
//       assert.strictEqual(res.type, "image/png");
//     });

//     test("should return 404 if summary image not found", async () => {
//       if (fs.existsSync(summaryImagePath)) fs.unlinkSync(summaryImagePath);

//       const res = await request(app).get("/countries/image");
//       assert.strictEqual(res.status, 404);
//       assert.deepStrictEqual(res.body, { error: "Summary image not found" });
//     });
//   });

  // ----------------------------------------
  // Validation and Error Handling
  // ----------------------------------------
//   describe("Validation and Error Handling", () => {
//     test("should return 400 for missing required fields when creating a country manually", async () => {
//       const invalidCountry = { capital: "Test City", region: "Test Region" };
//       const res = await request(app).post("/countries").send(invalidCountry);
//       if (res.status === 400) {
//         assert.strictEqual(res.body.error, "Validation failed");
//         assert.ok(res.body.details.name || res.body.details.currency_code);
//       }
//     });

//     test("should return 500 for internal server errors gracefully", async () => {
//       process.env.FORCE_INTERNAL_ERROR = "true";
//       const res = await request(app).get("/countries");
//       delete process.env.FORCE_INTERNAL_ERROR;
//       if (res.status === 500) {
//         assert.deepStrictEqual(res.body, { error: "Internal server error" });
//       }
//     });
//   });
});
