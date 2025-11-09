#!/bin/bash

# Test script for plant-data-aggregator API security
# This script tests that API key authentication is working correctly

API_URL="http://localhost:8081"
API_KEY="dev-key-change-in-production-make-it-very-secure-and-random"

echo "Testing Plant Data Aggregator API Security"
echo "=========================================="
echo ""

# Test 1: Health check (should work without API key)
echo "Test 1: Health check (should work without API key)"
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/actuator/health")
if [ "$response" == "200" ]; then
    echo "✓ PASS: Health check works without API key"
else
    echo "✗ FAIL: Health check returned $response"
fi
echo ""

# Test 2: Plant search without API key (should fail with 403)
echo "Test 2: Plant search without API key (should fail with 403)"
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/v1/plant-data/plants/search?q=tomato")
if [ "$response" == "403" ]; then
    echo "✓ PASS: Plant search blocked without API key (403)"
else
    echo "✗ FAIL: Plant search returned $response (expected 403)"
fi
echo ""

# Test 3: Plant search with wrong API key (should fail with 403)
echo "Test 3: Plant search with wrong API key (should fail with 403)"
response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: wrong-key" "$API_URL/api/v1/plant-data/plants/search?q=tomato")
if [ "$response" == "403" ]; then
    echo "✓ PASS: Plant search blocked with wrong API key (403)"
else
    echo "✗ FAIL: Plant search returned $response (expected 403)"
fi
echo ""

# Test 4: Plant search with correct API key (should succeed with 200)
echo "Test 4: Plant search with correct API key (should succeed)"
response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: $API_KEY" "$API_URL/api/v1/plant-data/plants/search?q=tomato")
if [ "$response" == "200" ]; then
    echo "✓ PASS: Plant search works with correct API key"
else
    echo "✗ FAIL: Plant search returned $response (expected 200)"
fi
echo ""

# Test 5: Get plant details with correct API key
echo "Test 5: Get plant details with correct API key"
response=$(curl -s -H "X-API-Key: $API_KEY" "$API_URL/api/v1/plant-data/plants/search?q=tomato")
if [ ! -z "$response" ] && [ "$response" != "null" ]; then
    echo "✓ PASS: Plant details retrieved successfully"
    echo "  Sample response: $(echo $response | cut -c1-100)..."
else
    echo "✗ FAIL: No data returned"
fi
echo ""

# Test 6: Get families with correct API key
echo "Test 6: Get families endpoint with correct API key"
response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: $API_KEY" "$API_URL/api/v1/plant-data/families")
if [ "$response" == "200" ]; then
    echo "✓ PASS: Families endpoint works with correct API key"
else
    echo "✗ FAIL: Families endpoint returned $response (expected 200)"
fi
echo ""

echo "=========================================="
echo "Security test completed!"
echo ""
echo "Note: If plant-data-aggregator is not running, all tests will fail."
echo "Start it with: cd plant-data-aggregator && ./gradlew bootRun"
