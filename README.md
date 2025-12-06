# Vendor Scrapers Monorepo

A unified collection of vendor product scrapers for electrical and pool supply distributors.

## Supported Vendors

| Vendor | Type | Auth Method | Port |
|--------|------|-------------|------|
| CED (Consolidated Electrical) | Electrical | Browserless + Login | 3011 |
| Pool360 | Pool Supplies | Browserless + Login | 3021 |
| Home Depot | Retail | SerpAPI | 3022 |

## Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/vendor-scrapers.git
cd vendor-scrapers

# Configure environment files
cp services/ced/.env.template services/ced/.env
cp services/pool360/.env.template services/pool360/.env
cp services/homedepot/.env.template services/homedepot/.env

# Edit .env files with your credentials
nano services/ced/.env
nano services/pool360/.env
nano services/homedepot/.env

# Start all services
cd compose
docker compose -f vendor-scrapers.yml up -d --build

# Test endpoints
curl http://localhost:3011/health  # CED
curl http://localhost:3021/health  # Pool360
curl http://localhost:3022/health  # Home Depot
```

## Project Structure

```
vendor-scrapers/
├── services/           # Individual scraper services
│   ├── ced/
│   ├── pool360/
│   └── homedepot/
├── common/             # Shared libraries
│   ├── normalize/      # Response normalization
│   ├── utils/          # Utilities (logger, http, error, scoring)
│   └── config/         # Environment configuration
├── compose/            # Docker Compose files
│   └── vendor-scrapers.yml
└── docs/               # Documentation
```

## API Endpoints

All scrapers expose the same endpoints:

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "ts": "2024-01-15T12:00:00.000Z",
  "vendor": "ced"
}
```

### POST /search

Search for products.

**Request:**
```json
{
  "part": "search term"
}
```

**Response:**
```json
{
  "success": true,
  "part": "search term",
  "name": "Best Match Product",
  "price": 99.99,
  "stock": "In Stock",
  "url": "https://...",
  "bestMatch": {
    "name": "Product Name",
    "price": 99.99,
    "stock": "In Stock",
    "sku": "ABC123",
    "mfgNumber": "MFG-001",
    "manufacturer": "Brand",
    "description": "...",
    "unitOfMeasure": "each",
    "image": "https://...",
    "url": "https://..."
  },
  "items": [...]
}
```

## Shared Libraries

### Normalization (`common/normalize`)

Ensures all scrapers return identical JSON structure.

### Scoring (`common/utils/scoring`)

Text similarity and product ranking algorithms.

### Error Handling (`common/utils/error`)

Standardized error response formatting.

### HTTP Client (`common/utils/http`)

Shared HTTP utilities including browserless integration.

## Adding a New Vendor

1. Create `services/newvendor/` directory
2. Copy structure from existing vendor
3. Implement vendor-specific scraper logic in `src/`
4. Import shared utilities from `/app/common`
5. Add service to `compose/vendor-scrapers.yml`
6. Update documentation

## Documentation

- [Setup Guide](docs/SETUP.md) - Deployment instructions
- [Architecture](docs/ARCHITECTURE.md) - Technical design

## License

MIT - See [LICENSE](LICENSE)
