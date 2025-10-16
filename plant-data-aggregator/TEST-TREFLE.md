# Testing Trefle Integration

⚠️ **IMPORTANT: Rate Limits**
- Trefle free tier: **60 requests per minute**
- Our cache (1 hour TTL) helps reduce API calls
- Be conservative with testing to avoid hitting limits

## Step 1: Get Your Trefle API Key

1. Go to [https://trefle.io](https://trefle.io)
2. Sign up for a free account
3. Go to your profile/dashboard
4. Copy your API token/key

## Step 2: Set the Environment Variable

In your terminal:

```bash
export TREFLE_API_KEY=your_actual_api_key_here
```

**Tip**: To make this permanent, add it to your `~/.zshrc`:
```bash
echo 'export TREFLE_API_KEY=your_actual_api_key_here' >> ~/.zshrc
source ~/.zshrc
```

## Step 3: Start the Application

```bash
cd /Users/Jorn-Are.Klubben.Flaten/dev/solo/gardentime
./gradlew :plant-data-aggregator:bootRun
```

The application will start on **http://localhost:8081**

## Step 4: Test the Endpoints

Open a new terminal window and run these tests:

### Test 1: Health Check
```bash
curl http://localhost:8081/api/trefle/health | jq
```

Expected output:
```json
{
  "service": "trefle",
  "configured": true,
  "status": "ready"
}
```

If you see `"configured": false`, the API key is not set correctly.

### Test 2: Search for Tomatoes
```bash
curl "http://localhost:8081/api/trefle/search?query=tomato" | jq
```

This should return a list of tomato plants from Trefle.

### Test 3: List Plants
```bash
curl "http://localhost:8081/api/trefle/plants?page=1" | jq
```

This should return the first page of plants.

### Test 4: Get Specific Plant Details
First, grab an ID from one of the search results above, then:
```bash
curl "http://localhost:8081/api/trefle/plants/183086" | jq
```

Replace `183086` with an actual plant ID from your search results.

### Test 5: Check API Statistics
```bash
curl http://localhost:8081/api/trefle/stats | jq
```

This shows how many API calls have been made today.

## Troubleshooting

### "Service not configured" error
- Make sure you exported the TREFLE_API_KEY environment variable
- Restart the application after setting the variable
- Verify the variable is set: `echo $TREFLE_API_KEY`

### "Connection refused" error
- Make sure the application is running on port 8081
- Check if another service is using port 8081: `lsof -i :8081`

### No data returned
- Check the application logs for errors
- Verify your API key is valid on trefle.io
- Check if you've hit the rate limit (free tier has limits)

### Application won't start
- Make sure PostgreSQL is running (check docker-compose)
- Check the logs: `./gradlew :plant-data-aggregator:bootRun --info`

## What to Look For

✅ **Success indicators:**
- Health check returns `"configured": true`
- Search returns plant data with scientific names
- API stats increment with each call
- No error messages in the application logs

❌ **Problem indicators:**
- Health check returns `"configured": false`
- Empty data arrays in responses
- 401/403 errors in logs
- "Rate limit exceeded" warnings

## Quick Test Script

Save this as `test-trefle.sh`:

```bash
#!/bin/bash

echo "Testing Trefle Integration..."
echo

echo "1. Health Check:"
curl -s http://localhost:8081/api/trefle/health | jq
echo

echo "2. Search for 'tomato':"
curl -s "http://localhost:8081/api/trefle/search?query=tomato" | jq '.data[0] | {id, common_name, scientific_name, family}'
echo

echo "3. API Stats:"
curl -s http://localhost:8081/api/trefle/stats | jq
echo

echo "Done!"
```

Make it executable and run:
```bash
chmod +x test-trefle.sh
./test-trefle.sh
```

## Next Steps After Testing

Once Trefle is working:
1. ✅ Verify data quality (check a few plants manually)
2. ✅ Test caching (run the same query twice, should be faster)
3. ✅ Monitor rate limits (check stats regularly)
4. 🔄 Implement PerenualService (same pattern)
5. 🔄 Build the merge service to combine both APIs
