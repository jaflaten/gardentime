# Testing Perenual Integration

⚠️ **CRITICAL: Rate Limits**
- Perenual free tier: **100 requests per DAY** (very limited!)
- Our cache (1 hour TTL) is essential to conserve quota
- Be **very conservative** with testing - each API call counts
- Use the provided test script which makes only ~5 calls total

## Step 1: Get Your Perenual API Key

1. Go to [https://perenual.com/docs/api](https://perenual.com/docs/api)
2. Sign up for a free account
3. Go to your dashboard/profile
4. Copy your API key

## Step 2: Set the Environment Variable

In your terminal:

```bash
export PERENUAL_API_KEY=your_actual_api_key_here
```

**Tip**: To make this permanent, add it to your `~/.zshrc`:
```bash
echo 'export PERENUAL_API_KEY=your_actual_api_key_here' >> ~/.zshrc
source ~/.zshrc
```

## Step 3: Start the Application

```bash
cd /Users/Jorn-Are.Klubben.Flaten/dev/solo/gardentime
./gradlew :plant-data-aggregator:bootRun
```

The application will start on **http://localhost:8081**

## Step 4: Test the Endpoints

⚠️ **IMPORTANT**: Use the provided test script to conserve your daily quota!

### Quick Test Script (Recommended)

Run the provided test script which makes only ~5 API calls:

```bash
chmod +x plant-data-aggregator/test-perenual.sh
./plant-data-aggregator/test-perenual.sh
```

### Manual Tests (Use Sparingly)

If you need to test manually, here are the endpoints. **Remember: each curl call uses 1 of your 100 daily requests!**

#### Test 1: Health Check (0 API calls - safe!)
```bash
curl http://localhost:8081/api/perenual/health | jq
```

Expected output:
```json
{
  "service": "perenual",
  "configured": true,
  "status": "ready"
}
```

If you see `"configured": false`, the API key is not set correctly.

#### Test 2: Search for Tomatoes (1 API call)
```bash
curl "http://localhost:8081/api/perenual/search?query=tomato" | jq
```

This should return a list of tomato plants from Perenual.

#### Test 3: List Edible Plants (1 API call)
```bash
curl "http://localhost:8081/api/perenual/plants?page=1&edible=true" | jq
```

This should return edible plants only.

#### Test 4: Get Specific Plant Details (1 API call)
First, grab an ID from one of the search results above, then:
```bash
curl "http://localhost:8081/api/perenual/plants/1234" | jq
```

Replace `1234` with an actual plant ID from your search results.

#### Test 5: Batch Fetch (N API calls - one per plant!)
```bash
curl -X POST http://localhost:8081/api/perenual/plants/batch \
  -H "Content-Type: application/json" \
  -d '{"ids": [1, 2, 3]}' | jq
```

⚠️ This makes 3 API calls (one per ID)!

#### Test 6: Check API Statistics (0 API calls - safe!)
```bash
curl http://localhost:8081/api/perenual/stats | jq
```

This shows how many API calls have been made today.

## Testing Cache (Recommended!)

To verify caching is working and conserve quota:

1. Run a search: `curl "http://localhost:8081/api/perenual/search?query=basil"`
2. Check stats - should show 1 call made
3. Run the **exact same** search again
4. Check stats again - should still show 1 call (cached!)
5. Check application logs - should say "from cache"

## Troubleshooting

### "Service not configured" error
- Make sure you exported the PERENUAL_API_KEY environment variable
- Restart the application after setting the variable
- Verify the variable is set: `echo $PERENUAL_API_KEY`

### "Connection refused" error
- Make sure the application is running on port 8081
- Check if another service is using port 8081: `lsof -i :8081`

### No data returned
- Check the application logs for errors
- Verify your API key is valid on perenual.com
- **Check if you've hit the daily limit** (100 requests/day)

### Rate limit exceeded
- Check stats endpoint to see how many calls you've made today
- Wait until tomorrow (resets at midnight UTC typically)
- Consider upgrading to a paid plan if needed for development

### Application won't start
- Make sure PostgreSQL is running (check docker-compose)
- Check the logs: `./gradlew :plant-data-aggregator:bootRun --info`

## What to Look For

✅ **Success indicators:**
- Health check returns `"configured": true`
- Search returns plant data with scientific names (as arrays!)
- API stats increment correctly (but slowly!)
- Cache works (same query = no API call increase)
- No error messages in the application logs

❌ **Problem indicators:**
- Health check returns `"configured": false`
- Empty data arrays in responses
- 401/403/429 errors in logs
- Stats show 100+ calls (daily limit hit!)

## Key Differences from Trefle

1. **Rate Limit**: 100/day vs Trefle's 60/minute - **much more restrictive**
2. **Scientific Names**: Perenual returns as array `["Solanum lycopersicum"]`
3. **Response Fields**: Different structure, more boolean flags
4. **Filtering**: Perenual supports `edible=true/false` and `indoor=true/false`
5. **Pagination**: Uses `current_page`, `last_page`, `per_page` format

## Daily Quota Management

With only 100 requests/day, you need to be strategic:

### During Development (suggestions):
- ✅ Use the test script (5 calls total)
- ✅ Rely heavily on caching
- ✅ Test with the same plants repeatedly
- ✅ Use health/stats endpoints (free)
- ❌ Don't list all pages
- ❌ Don't batch fetch large lists
- ❌ Don't search for every vegetable

### Quota Breakdown Example:
- Health checks: 0 calls (unlimited)
- Stats checks: 0 calls (unlimited)
- 10 unique searches: 10 calls
- 10 plant details: 10 calls
- 5 list operations: 5 calls
- **Total: 25 calls/day used**
- **Remaining: 75 calls**

### Conservation Tips:
1. **Cache Duration**: Our 1-hour cache is your friend
2. **Batch Wisely**: Only batch fetch what you really need
3. **Plan Tests**: Write down what you want to test before making calls
4. **Monitor Stats**: Check frequently to avoid surprises
5. **Morning Testing**: Start fresh each day, check quota first

## Next Steps After Testing

Once Perenual is working:
1. ✅ Verify data quality (check a few plants manually)
2. ✅ **Test caching thoroughly** (critical for quota management)
3. ✅ Monitor rate limits closely (check stats regularly)
4. ✅ Compare Perenual vs Trefle data for same plants
5. 🔄 Enhance PlantMergeService to handle both data sources
6. 🔄 Build intelligent API call strategy (prefer cached/Trefle when possible)

## Emergency: Hit the Daily Limit?

If you hit 100 calls and need to keep testing:

1. **Wait**: Limit resets after 24 hours
2. **Cache**: Continue testing with cached data
3. **Trefle**: Use Trefle API instead (60/minute is generous)
4. **Upgrade**: Consider paid Perenual plan for development
5. **Mock**: Create mock data for testing

## Recommended Test Plan (First Time)

Day 1 - Basic Setup (25 calls):
```bash
# Health check (0 calls)
# Search 5 common plants (5 calls)
# Get details for those 5 (5 calls) 
# List edible plants page 1-3 (3 calls)
# Test caching with repeats (0 calls)
# Reserve 12 calls for experimentation
```

Day 2 - Data Quality (30 calls):
```bash
# Compare 10 plants with Trefle (10 details = 10 calls)
# Test various plant types (10 searches = 10 calls)
# Reserve 10 for debugging
```

Day 3+ - Integration Testing:
```bash
# Test merge service integration
# Use mostly cached data
# Strategic new calls only when needed
```
