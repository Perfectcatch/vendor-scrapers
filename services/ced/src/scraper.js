/**
 * CED-specific scraping logic
 * Uses browserless to scrape CED portal
 */

const axios = require('axios');

/**
 * Browserless function code for CED scraping
 */
const browserlessFunctionCode = `
module.exports = async function ({ page, context }) {
  const { username, password, partNumber } = context;
  const baseUrl = "https://cedlargo.portalced.com";

  try {
    // Go to login page
    await page.goto(baseUrl + "/login", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 2000); });

    // Wait for and fill username field
    await page.waitForSelector('[data-id="username"]', { timeout: 15000 });
    await page.type('[data-id="username"]', username, { delay: 40 });

    // Wait for and fill password field
    await page.waitForSelector('[data-id="password"]', { timeout: 15000 });
    await page.type('[data-id="password"]', password, { delay: 40 });

    // Click login button and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }).catch(function() {}),
      page.click('button[type="submit"]')
    ]);
    await new Promise(function(r) { setTimeout(r, 2000); });

    // Verify login success
    var currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      // Retry login once
      await page.waitForSelector('[data-id="username"]', { timeout: 10000 });
      await page.evaluate(function() {
        var u = document.querySelector('[data-id="username"]');
        var p = document.querySelector('[data-id="password"]');
        if (u) u.value = "";
        if (p) p.value = "";
      });
      await page.type('[data-id="username"]', username, { delay: 40 });
      await page.type('[data-id="password"]', password, { delay: 40 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 }).catch(function() {}),
        page.click('button[type="submit"]')
      ]);
      await new Promise(function(r) { setTimeout(r, 2000); });

      currentUrl = page.url();
      if (currentUrl.includes("/login")) {
        return {
          data: { success: false, part: partNumber, error: "Login failed after retry" },
          type: "application/json"
        };
      }
    }

    // Navigate to search
    const searchUrl = baseUrl + "/product-list?term=" + encodeURIComponent(partNumber);
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 2000); });

    const pageText = await page.evaluate(function() {
      if (!document || !document.body) return "";
      return document.body.innerText || "";
    });

    return {
      data: {
        success: true,
        part: partNumber,
        rawText: pageText
      },
      type: "application/json"
    };
  } catch (err) {
    return {
      data: { success: false, part: partNumber, error: err.message },
      type: "application/json"
    };
  }
};
`;

/**
 * Search CED for products
 * @param {string} partNumber - Search term
 * @param {Object} config - Configuration with browserless URL, token, credentials
 * @returns {Promise<Object>} Raw scrape result
 */
async function searchCed(partNumber, config) {
  const { browserlessUrl, browserlessToken, username, password } = config;
  
  const response = await axios.post(
    `${browserlessUrl}/function?token=${encodeURIComponent(browserlessToken)}`,
    {
      code: browserlessFunctionCode,
      context: {
        username,
        password,
        partNumber
      }
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 90000
    }
  );

  return response.data;
}

/**
 * Get search URL for CED
 */
function getSearchUrl(partNumber) {
  return `https://cedlargo.portalced.com/product-list?term=${encodeURIComponent(partNumber)}`;
}

module.exports = {
  searchCed,
  getSearchUrl,
  browserlessFunctionCode
};
