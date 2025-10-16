#!/bin/bash

echo "🌱 Testing Trefle Integration..."
echo "⚠️  Rate Limit: 60 requests/minute - testing conservatively"
echo

echo "✓ Test 1: Health Check"
curl -s http://localhost:8081/api/trefle/health | jq
echo
sleep 2

echo "✓ Test 2: Search for 'tomato'"
curl -s "http://localhost:8081/api/trefle/search?query=tomato" | jq '.data[0:2] | .[] | {id, common_name, scientific_name, family}'
echo
sleep 2

echo "✓ Test 3: API Stats"
curl -s http://localhost:8081/api/trefle/stats | jq
echo

echo "✅ Basic tests complete!"
echo "💡 Tip: Run the same search again to test caching (should be instant)"

