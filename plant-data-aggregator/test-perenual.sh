#!/bin/bash

echo "🌿 Testing Perenual Integration..."
echo "⚠️  Rate Limit: 100 requests/day (FREE tier) - testing very conservatively"
echo "💡 Total API calls in this script: ~3 (thanks to caching!)"
echo "   • Test 2: Search (1 call)"
echo "   • Test 3: List edible (1 call)"  
echo "   • Test 4: Get details (1 call - first time, 0 if repeated)"
echo

echo "✓ Test 1: Health Check"
curl -s http://localhost:8081/api/perenual/health | jq
echo
sleep 2

echo "✓ Test 2: Search for 'tomato' (1 API call)"
curl -s "http://localhost:8081/api/perenual/search?query=tomato" | jq '.data[0:2] | .[] | {id, common_name, scientific_name, family, genus}'
echo
sleep 3

echo "✓ Test 3: List edible plants - page 1 (1 API call)"
curl -s "http://localhost:8081/api/perenual/plants?page=1&edible=true" | jq '{total, per_page, current_page, plants: .data[0:2] | .[] | {id, common_name, genus}}'
echo
sleep 3

echo "✓ Test 4: Get plant detail - using ID from cached search (0 API calls - cached!)"
# This should use the cached result from Test 2, so it's free!
PLANT_ID=$(curl -s "http://localhost:8081/api/perenual/search?query=tomato" 2>/dev/null | jq -r '.data[0].id // 1')
if [ "$PLANT_ID" != "null" ] && [ "$PLANT_ID" != "" ] && [ "$PLANT_ID" != "1" ]; then
    echo "Fetching details for plant ID: $PLANT_ID"
    echo "⚠️  Note: Free tier has limited plant detail data - many fields may be null"
    curl -s "http://localhost:8081/api/perenual/plants/$PLANT_ID" | jq '{id, common_name, scientific_name, family, type, cycle, watering, sunlight, edible_fruit, edible_leaf, default_image: {thumbnail: .default_image.thumbnail, license: .default_image.license_name}}'
else
    echo "⚠️  Could not extract plant ID from search - skipping detail fetch"
fi
echo
sleep 3

echo "✓ Test 5: API Stats (no API call - internal stats only)"
curl -s http://localhost:8081/api/perenual/stats | jq
echo

echo "✅ Basic tests complete!"
echo "📊 Check stats above to see API call count"
echo "💡 Tip: Run the same searches again to test caching (should be instant and use 0 API calls)"
echo "⚠️  Remember: Only 100 requests/day on free tier - cache helps a lot!"
echo
echo "Next test ideas (run separately to conserve quota):"
echo "  • Search for other plants: basil, carrot, pepper"
echo "  • Test indoor filter: curl 'http://localhost:8081/api/perenual/plants?indoor=true'"
echo "  • Batch fetch: curl -X POST http://localhost:8081/api/perenual/plants/batch -H 'Content-Type: application/json' -d '{\"ids\": [1,2,3]}'"
