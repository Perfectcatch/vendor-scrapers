/**
 * Home Depot Scraper API
 * Uses SerpAPI for product data
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Import from common library (mounted at runtime)
const { normalizeResponse } = require('/app/common/normalize');
const { createErrorResponse } = require('/app/common/utils/error');

// Import local modules
const serpapi = require('./serpapi');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3000;
const STORE_ID = process.env.HOMEDEPOT_DEFAULT_STORE_ID || "6321";

// Startup logging
console.log(`[${new Date().toISOString()}] Home Depot Scraper API starting...`);
console.log(`[${new Date().toISOString()}] SerpAPI: ${serpapi.isConfigured() ? "configured" : "MISSING KEY"}`);
console.log(`[${new Date().toISOString()}] Store ID: ${STORE_ID}`);

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    ts: new Date().toISOString(),
    vendor: "homedepot",
    serpApiConfigured: serpapi.isConfigured(),
    storeId: STORE_ID
  });
});

/**
 * Search endpoint
 */
app.post("/search", async (req, res) => {
  const { part, storeId } = req.body;
  const startTime = Date.now();

  if (!part || typeof part !== "string" || !part.trim()) {
    return res.status(400).json({ success: false, error: "Missing part parameter" });
  }

  if (!serpapi.isConfigured()) {
    return res.status(500).json({ success: false, error: "SERPAPI_KEY not configured" });
  }

  const partNumber = part.trim();
  const targetStoreId = storeId || STORE_ID;
  const searchUrl = serpapi.getSearchUrl(partNumber);

  console.log(`[${new Date().toISOString()}] Searching for: ${partNumber}`);

  try {
    // Search via SerpAPI
    const result = await serpapi.searchProducts(partNumber, targetStoreId);

    const elapsed = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Search completed in ${elapsed}ms`);

    // Normalize response
    const response = normalizeResponse(partNumber, result.products, searchUrl);

    console.log(`[${new Date().toISOString()}] Found ${result.products.length} items`);

    res.json(response);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Error after ${elapsed}ms:`, error.message);

    res.status(500).json(createErrorResponse(partNumber, error, searchUrl));
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Home Depot Scraper API running on port ${PORT}`);
  console.log(`[${new Date().toISOString()}] Endpoints:`);
  console.log(`  GET  /health - Health check`);
  console.log(`  POST /search - Search products { "part": "..." }`);
});
