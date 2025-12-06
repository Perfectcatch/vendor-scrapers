# Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Future)                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  CED Scraper  │     │ Pool360       │     │ Home Depot    │
│  :3011        │     │ Scraper :3021 │     │ Scraper :3022 │
└───────┬───────┘     └───────┬───────┘     └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Browserless  │     │  Browserless  │     │   SerpAPI     │
│  :3010        │     │  :3020        │     │   (External)  │
└───────────────┘     └───────────────┘     └───────────────┘
```

## Directory Structure

```
vendor-scrapers/
├── services/                 # Individual scraper services
│   ├── ced/
│   │   ├── src/
│   │   │   ├── index.js     # Express server
│   │   │   ├── scraper.js   # Browserless scraping logic
│   │   │   └── parser.js    # Text parsing logic
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.template
│   ├── pool360/
│   │   └── (same structure)
│   └── homedepot/
│       ├── src/
│       │   ├── index.js
│       │   └── serpapi.js   # SerpAPI client
│       └── ...
├── common/                   # Shared libraries
│   ├── normalize/
│   │   └── index.js         # Response normalization
│   ├── utils/
│   │   ├── logger.js        # Structured logging
│   │   ├── http.js          # HTTP client utilities
│   │   ├── error.js         # Error handling
│   │   └── scoring.js       # Text similarity/scoring
│   └── config/
│       └── env.js           # Environment utilities
└── compose/
    └── vendor-scrapers.yml  # Unified Docker Compose
```

## Shared Libraries

### Normalization (`common/normalize`)

All scrapers must return the same JSON structure:

```javascript
{
  success: true,
  part: "search term",
  name: "Best match name",
  price: 99.99,
  stock: "In Stock",
  url: "https://...",
  bestMatch: { ... },
  items: [ ... ]
}
```

The `normalizeResponse()` function ensures consistency.

### Scoring (`common/utils/scoring`)

Product ranking uses token-based similarity:

```javascript
// Calculate text similarity (0-1)
similarity("pool pump", "Pool Pump Motor") // 0.5

// Score product relevance
scoreItem("pool pump", { name: "Pool Pump", sku: "PP-100" }) // 0.8
```

### Error Handling (`common/utils/error`)

Standardized error responses:

```javascript
createErrorResponse("pump", new Error("Timeout"), "https://...")
// Returns: { success: false, part: "pump", error: "Timeout", ... }
```

## Scraper Workflow

### Browser-Based (CED, Pool360)

```
1. Request → POST /search { "part": "pump" }
2. Browserless → Navigate to vendor site
3. Login → Authenticate with credentials
4. Search → Navigate to search page
5. Extract → Get page text content
6. Parse → Extract product data from text
7. Score → Rank by relevance
8. Normalize → Convert to standard format
9. Response → Return JSON
```

### API-Based (Home Depot)

```
1. Request → POST /search { "part": "pump" }
2. SerpAPI → Call Home Depot search API
3. Transform → Convert SerpAPI format
4. Normalize → Convert to standard format
5. Response → Return JSON
```

## Docker Architecture

### Volume Mounting

The common library is mounted read-only into each container:

```yaml
volumes:
  - ../common:/app/common:ro
```

This allows:
- Shared code without duplication
- Updates without rebuilding containers
- Consistent behavior across services

### Health Checks

All services implement health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Network

All services share a single Docker network:

```yaml
networks:
  vendor-scrapers-net:
    driver: bridge
```

## MCP Integration (Future)

Each scraper can be exposed as an MCP tool:

```javascript
// MCP Tool Definition
{
  name: "search_ced",
  description: "Search CED for electrical products",
  parameters: {
    part: { type: "string", description: "Part number or search term" }
  }
}
```

## API Gateway (Future)

A unified gateway could provide:

- Single endpoint for all vendors
- Request routing
- Rate limiting
- Authentication
- Response caching

```
POST /api/search
{
  "vendor": "ced",
  "part": "conduit"
}
```

## Design Principles

1. **Separation of Concerns** - Each service handles one vendor
2. **DRY** - Shared logic in common library
3. **Consistency** - Identical response format across vendors
4. **Resilience** - Graceful error handling, health checks
5. **Observability** - Structured logging, timestamps
6. **Scalability** - Independent services, easy to add vendors
