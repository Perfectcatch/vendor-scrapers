# Documentation

## Contents

- [SETUP.md](SETUP.md) - Deployment and configuration guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical design and patterns

## Quick Links

### API Reference

All scrapers expose:
- `GET /health` - Health check
- `POST /search` - Product search

### Ports

| Service | Port |
|---------|------|
| CED Browserless | 3010 |
| CED API | 3011 |
| Pool360 Browserless | 3020 |
| Pool360 API | 3021 |
| Home Depot API | 3022 |

### Response Format

```json
{
  "success": true,
  "part": "search term",
  "name": "Best Match",
  "price": 99.99,
  "stock": "In Stock",
  "url": "https://...",
  "bestMatch": { ... },
  "items": [ ... ]
}
```
