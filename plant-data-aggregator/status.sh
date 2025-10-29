#!/bin/bash

echo "🌱 Plant Data Aggregator - Status Check"
echo "========================================"
echo

# Check if app is running
if curl -s http://localhost:8081/actuator/health > /dev/null 2>&1; then
    echo "✅ Application is running on http://localhost:8081"
else
    echo "❌ Application is NOT running"
    echo "   Start it with: ./gradlew :plant-data-aggregator:bootRun"
    exit 1
fi

echo

# Check Trefle integration
echo "🌿 Trefle API Status:"
TREFLE_STATUS=$(curl -s http://localhost:8081/api/trefle/health | jq -r '.configured')
if [ "$TREFLE_STATUS" = "true" ]; then
    echo "   ✅ Configured and ready"
    TREFLE_STATS=$(curl -s http://localhost:8081/api/trefle/stats | jq -r '.callsMade')
    echo "   📊 API calls today: $TREFLE_STATS"
else
    echo "   ⚠️  Not configured - set TREFLE_API_KEY environment variable"
fi

echo

# Check Perenual integration
echo "🌿 Perenual API Status:"
PERENUAL_STATUS=$(curl -s http://localhost:8081/api/perenual/health | jq -r '.configured')
if [ "$PERENUAL_STATUS" = "true" ]; then
    echo "   ✅ Configured and ready"
    PERENUAL_STATS=$(curl -s http://localhost:8081/api/perenual/stats | jq -r '.callsMade')
    echo "   📊 API calls today: $PERENUAL_STATS / 100 (DAILY LIMIT!)"
    
    REMAINING=$((100 - PERENUAL_STATS))
    if [ $PERENUAL_STATS -gt 80 ]; then
        echo "   ⚠️  WARNING: Only $REMAINING calls remaining today!"
    else
        echo "   ✅ $REMAINING calls remaining today"
    fi
else
    echo "   ⚠️  Not configured - set PERENUAL_API_KEY environment variable"
fi

echo
echo "========================================"
echo "Quick Commands:"
echo "  • Test Trefle:    ./test-trefle.sh"
echo "  • Test Perenual:  ./test-perenual.sh (conserves quota!)"
echo "  • View docs:      cat TEST-PERENUAL.md"
echo "  • Check logs:     tail -f ../build/plant-data-aggregator.log"
echo
