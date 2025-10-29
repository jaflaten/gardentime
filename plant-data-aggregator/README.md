# Plant Data Aggregator Testing

This directory contains scripts and documentation for testing the external API integrations.

## Quick Start

### 1. Set up your API keys

```bash
# Trefle API (60 requests/minute - generous)
export TREFLE_API_KEY=your_trefle_key_here

# Perenual API (100 requests/DAY - very limited!)
export PERENUAL_API_KEY=your_perenual_key_here
```

### 2. Start the application

```bash
cd /path/to/gardentime
./gradlew :plant-data-aggregator:bootRun
```

### 3. Check status

```bash
cd plant-data-aggregator
./status.sh
```

### 4. Run tests

```bash
# Test Trefle (safe - 60/minute limit)
./test-trefle.sh

# Test Perenual (conservative - only ~5 API calls)
./test-perenual.sh
```

## Available Scripts

| Script | Purpose | API Calls |
|--------|---------|-----------|
| `status.sh` | Check service status and quota | 0 |
| `test-trefle.sh` | Test Trefle integration | ~3 |
| `test-perenual.sh` | Test Perenual integration | ~5 |

## Documentation

| File | Description |
|------|-------------|
| `TEST-TREFLE.md` | Trefle testing guide |
| `TEST-PERENUAL.md` | Perenual testing guide (rate limit warnings) |
| `IMPLEMENTATION-SUMMARY.md` | What was implemented |
| `docs/trefle-integration.md` | Trefle API documentation |
| `docs/perenual-integration.md` | Perenual API documentation |

## Important: Perenual Rate Limits

⚠️ **Perenual free tier: 100 requests per DAY**

This is extremely limited compared to Trefle's 60/minute. The test script is designed to be conservative:
- Uses only ~5 API calls total
- Relies heavily on caching
- Provides quota warnings

### Monitoring Your Quota

```bash
# Check current usage
curl http://localhost:8081/api/perenual/stats | jq

# Output shows:
# {
#   "callsMade": 15,    ← Current day's usage
#   "date": "2025-10-23"
# }
```

### Conservation Tips

1. **Use the test script** - Don't make manual curl calls unnecessarily
2. **Cache everything** - Run the same query twice to test caching
3. **Plan ahead** - Write down what you want to test before starting
4. **Check stats often** - Don't accidentally hit the limit
5. **Prefer Trefle** - Use Trefle for general testing when both APIs have the data

## Endpoints

All running on `http://localhost:8081`:

### Trefle
- `GET /api/trefle/health` - Health check
- `GET /api/trefle/search?query={q}` - Search plants
- `GET /api/trefle/plants?page={p}` - List plants
- `GET /api/trefle/plants/{id}` - Plant details
- `GET /api/trefle/stats` - API usage stats

### Perenual
- `GET /api/perenual/health` - Health check
- `GET /api/perenual/search?query={q}` - Search plants
- `GET /api/perenual/plants?edible=true&indoor=false` - List with filters
- `GET /api/perenual/plants/{id}` - Plant details
- `POST /api/perenual/plants/batch` - Batch fetch
- `GET /api/perenual/stats` - API usage stats

## Troubleshooting

### Services not configured
```bash
# Check environment variables
echo $TREFLE_API_KEY
echo $PERENUAL_API_KEY

# If empty, set them and restart the app
export TREFLE_API_KEY=your_key
export PERENUAL_API_KEY=your_key
```

### Hit rate limit
- **Trefle**: Wait a minute (60/minute resets quickly)
- **Perenual**: Wait until tomorrow (100/day is harsh!)

### Application not running
```bash
# Start it
./gradlew :plant-data-aggregator:bootRun

# Check it's running
curl http://localhost:8081/actuator/health
```

### Cache not working
Check application logs for cache hit/miss messages. Cache should work automatically.

## Next Steps

After both APIs are tested:
1. Compare data quality between Trefle and Perenual
2. Test the merge service with both data sources
3. Build unified search functionality
4. Implement smart quota management (prefer cached/Trefle)

## Build & Deploy

```bash
# Build only (no tests)
./gradlew :plant-data-aggregator:build -x test

# Build with tests
./gradlew :plant-data-aggregator:build

# Run
./gradlew :plant-data-aggregator:bootRun
```
