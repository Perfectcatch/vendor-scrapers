/**
 * CED-specific parsing logic
 * Extracts product data from raw page text
 */

/**
 * Parse CED product list from raw page text
 * @param {string} rawText - Raw text from page
 * @returns {Array} Parsed product items
 */
function parseCedProductList(rawText) {
  const items = [];
  if (!rawText || typeof rawText !== "string") return items;

  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("Local Description:")) continue;

    const localDescription = lines[i].substring("Local Description:".length).trim();

    let catNumber = null;
    let itemNumber = null;
    let upc = null;
    let manufacturer = null;
    let descriptionLines = [];
    let price = null;
    let stock = null;
    let unitOfMeasure = null;

    // Look backwards for manufacturer (usually 2-4 lines before Local Description)
    for (let b = i - 1; b >= Math.max(0, i - 5); b--) {
      const prevLine = lines[b];
      // Manufacturer is usually all caps, no special prefixes
      if (/^[A-Z][A-Z\s&]+$/.test(prevLine) && prevLine.length > 2 && prevLine.length < 50) {
        manufacturer = prevLine;
        break;
      }
    }

    for (let j = i + 1; j < Math.min(lines.length, i + 30); j++) {
      const line = lines[j];

      if (!catNumber && line.startsWith("Cat #:")) {
        catNumber = line.substring("Cat #:".length).trim();
      }

      if (!itemNumber && line.startsWith("Item #:")) {
        itemNumber = line.substring("Item #:".length).trim();
      }

      if (!upc && line.startsWith("UPC:")) {
        upc = line.substring("UPC:".length).trim();
      }

      if (/^Specifications:/.test(line)) {
        for (let k = j + 1; k < Math.min(lines.length, j + 15); k++) {
          const specLine = lines[k];
          if (/^Quantity for /.test(specLine)) break;
          if (/^Local Description:/.test(specLine)) break;
          if (/^\$/.test(specLine)) break;
          descriptionLines.push(specLine);
        }
      }

      // Extract price (e.g., "$33.00")
      if (price === null && /^\$[0-9]/.test(line)) {
        const m = line.match(/^\$([0-9]+(?:[.,][0-9]{2})?)/);
        if (m) {
          const num = parseFloat(m[1].replace(",", ""));
          if (!Number.isNaN(num)) price = num;
        }
      }

      // Extract unit of measure
      if (unitOfMeasure === null && /^(each|per\s+\d+|per\s+foot|per\s+ft|\/\s*\d+)/i.test(line)) {
        unitOfMeasure = line;
      }

      // Extract stock
      if (stock === null) {
        const stockMatch = line.match(/^(\d+)\s+in\s+stock/i);
        if (stockMatch) {
          stock = parseInt(stockMatch[1], 10);
        } else if (/^in\s+stock/i.test(line)) {
          stock = "In Stock";
        } else if (/^out\s+of\s+stock/i.test(line)) {
          stock = 0;
        }
      }

      // Stop at next product
      if (j > i + 5 && line.startsWith("Local Description:")) break;
    }

    items.push({
      name: localDescription || catNumber || itemNumber || "",
      manufacturer: manufacturer || "",
      cat: catNumber || "",
      item: itemNumber || "",
      sku: itemNumber || "",
      mfgNumber: catNumber || "",
      upc: upc || "",
      price: price,
      unitOfMeasure: unitOfMeasure || "each",
      stock: stock,
      image: null,
      description: descriptionLines.join(" ") || ""
    });
  }

  return items;
}

module.exports = {
  parseCedProductList
};
