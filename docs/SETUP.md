# Setup Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development only)

## Server Deployment

### 1. Clone Repository

```bash
cd /opt/docker
git clone https://github.com/your-org/vendor-scrapers.git
cd vendor-scrapers
```

### 2. Configure Environment Files

#### CED Scraper
```bash
cp services/ced/.env.template services/ced/.env
nano services/ced/.env
```

Set:
- `CED_USERNAME` - Your CED portal username
- `CED_PASSWORD` - Your CED portal password

#### Pool360 Scraper
```bash
cp services/pool360/.env.template services/pool360/.env
nano services/pool360/.env
```

Set:
- `POOL360_USERNAME` - Your Pool360 username
- `POOL360_PASSWORD` - Your Pool360 password

#### Home Depot Scraper
```bash
cp services/homedepot/.env.template services/homedepot/.env
nano services/homedepot/.env
```

Set:
- `SERPAPI_KEY` - Your SerpAPI key (get from https://serpapi.com)

### 3. Start Services

```bash
cd compose
docker compose -f vendor-scrapers.yml up -d --build
```

### 4. Verify Deployment

```bash
# Check all containers are running
docker ps | grep scraper

# Test health endpoints
curl -s http://localhost:3011/health | jq .
curl -s http://localhost:3021/health | jq .
curl -s http://localhost:3022/health | jq .

# Test search
curl -s -X POST http://localhost:3011/search \
  -H "Content-Type: application/json" \
  -d '{"part": "conduit"}' | jq .
```

## Required Ports

| Port | Service | Description |
|------|---------|-------------|
| 3010 | ced-browserless | CED browser automation |
| 3011 | ced-scraper-api | CED API |
| 3020 | pool360-browserless | Pool360 browser automation |
| 3021 | pool360-scraper-api | Pool360 API |
| 3022 | homedepot-scraper-api | Home Depot API |

## Environment Variables

### CED

| Variable | Required | Description |
|----------|----------|-------------|
| `CED_USERNAME` | Yes | CED portal username |
| `CED_PASSWORD` | Yes | CED portal password |
| `BROWSERLESS_URL` | No | Browserless URL (default: http://ced-browserless:3000) |
| `BROWSERLESS_TOKEN` | No | Browserless token (default: super_random_token) |
| `PORT` | No | API port (default: 3000) |

### Pool360

| Variable | Required | Description |
|----------|----------|-------------|
| `POOL360_USERNAME` | Yes | Pool360 username |
| `POOL360_PASSWORD` | Yes | Pool360 password |
| `BROWSERLESS_URL` | No | Browserless URL |
| `BROWSERLESS_TOKEN` | No | Browserless token |
| `PORT` | No | API port (default: 3000) |

### Home Depot

| Variable | Required | Description |
|----------|----------|-------------|
| `SERPAPI_KEY` | Yes | SerpAPI API key |
| `HOMEDEPOT_DEFAULT_STORE_ID` | No | Store ID (default: 6321 = Largo, FL) |
| `HOMEDEPOT_DELIVERY_ZIP` | No | Delivery ZIP (default: 33770) |
| `PORT` | No | API port (default: 3000) |

## Updating Services

```bash
cd /opt/docker/vendor-scrapers/compose

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f vendor-scrapers.yml up -d --build
```

## Viewing Logs

```bash
# All services
docker compose -f vendor-scrapers.yml logs -f

# Specific service
docker logs -f ced-scraper-api
docker logs -f pool360-scraper-api
docker logs -f homedepot-scraper-api
```

## Troubleshooting

### Service won't start

1. Check logs: `docker logs <container-name>`
2. Verify .env file exists and has correct values
3. Check port conflicts: `netstat -tlnp | grep 30`

### Login failures (CED/Pool360)

1. Verify credentials in .env file
2. Check if website login works manually
3. Review browserless logs for errors

### SerpAPI errors (Home Depot)

1. Verify SERPAPI_KEY is set
2. Check API quota at serpapi.com
3. Test API key directly with curl
