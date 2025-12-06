/**
 * SerpAPI client for Home Depot
 */

const axios = require('axios');
const qs = require('qs');

const SERPAPI_BASE_URL = "https://serpapi.com/search";
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const DEFAULT_STORE_ID = process.env.HOMEDEPOT_DEFAULT_STORE_ID || "6321";
const DEFAULT_DELIVERY_ZIP = process.env.HOMEDEPOT_DELIVERY_ZIP || "33770";

/**
 * Check if SerpAPI key is configured
 */
function isConfigured() {
  return !!SERPAPI_KEY;
}

/**
 * Make a request to SerpAPI
 */
async function makeRequest(params) {
  if (!SERPAPI_KEY) {
    throw new Error("SERPAPI_KEY not configured - please add to .env file");
  }

  const queryParams = {
    ...params,
    api_key: SERPAPI_KEY,
    engine: "home_depot"
  };

  const url = `${SERPAPI_BASE_URL}?${qs.stringify(queryParams)}`;

  try {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: { "Accept": "application/json" }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) throw new Error("Invalid SERPAPI_KEY");
      if (status === 429) throw new Error("SerpAPI rate limit exceeded");
      throw new Error(`SerpAPI error: ${status}`);
    }
    throw new Error(`SerpAPI request failed: ${error.message}`);
  }
}

/**
 * Search for products
 */
async function searchProducts(query, storeId = DEFAULT_STORE_ID, deliveryZip = DEFAULT_DELIVERY_ZIP) {
  console.log(`[SerpAPI] Searching: "${query}" store=${storeId} zip=${deliveryZip}`);

  const data = await makeRequest({
    q: query,
    store_id: storeId,
    delivery_zip: deliveryZip,
    no_cache: true
  });

  const products = (data.products || []).map(normalizeProduct);

  return {
    success: true,
    query,
    storeId,
    totalResults: data.search_information?.total_results || products.length,
    products
  };
}

/**
 * Normalize a SerpAPI product
 */
function normalizeProduct(product) {
  if (!product) return null;

  return {
    name: product.title || product.name || null,
    productId: product.product_id || null,
    sku: product.model_number || null,
    mfgNumber: product.model_number || null,
    manufacturer: product.brand || null,
    price: typeof product.price === 'number' ? product.price : null,
    stock: extractStock(product),
    rating: product.rating || null,
    reviewCount: product.reviews || null,
    image: product.thumbnail || null,
    url: product.link || null,
    fulfillment: extractFulfillment(product),
    description: product.description || null
  };
}

function extractStock(product) {
  if (!product) return null;
  if (product.in_stock === true) return "In Stock";
  if (product.in_stock === false) return 0;
  if (product.pickup) return "Available for Pickup";
  if (product.delivery) return "Available for Delivery";
  return null;
}

function extractFulfillment(product) {
  if (!product) return null;
  const f = {};
  if (product.pickup !== undefined) f.pickup = product.pickup;
  if (product.delivery !== undefined) f.delivery = product.delivery;
  return Object.keys(f).length > 0 ? f : null;
}

/**
 * Get search URL
 */
function getSearchUrl(partNumber) {
  return `https://www.homedepot.com/s/${encodeURIComponent(partNumber)}`;
}

module.exports = {
  isConfigured,
  searchProducts,
  normalizeProduct,
  getSearchUrl,
  DEFAULT_STORE_ID,
  DEFAULT_DELIVERY_ZIP
};
