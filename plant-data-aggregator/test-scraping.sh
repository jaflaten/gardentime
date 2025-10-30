#!/bin/bash

# Test the scraping service
# Usage: ./test-scraping.sh [single|top-priority|custom]

BASE_URL="http://localhost:8081/api/admin/scraping"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Plant Data Aggregator - Scraping Test ===${NC}\n"

# Check if service is running
echo "1. Checking service status..."
STATUS=$(curl -s "$BASE_URL/status")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Service is running${NC}"
    echo "$STATUS" | jq '.'
else
    echo -e "${RED}✗ Service is not running. Start it with: ./gradlew :plant-data-aggregator:bootRun${NC}"
    exit 1
fi

echo -e "\n2. Available plants..."
curl -s "$BASE_URL/available-plants?priority=1" | jq '.plants[] | {slug, commonName, category}'

# Determine test mode
MODE=${1:-single}

case $MODE in
    "single")
        echo -e "\n${YELLOW}3. Testing single plant scrape (tomatoes)...${NC}"
        echo "This will take ~3-5 seconds..."
        
        RESULT=$(curl -s -X POST "$BASE_URL/plant/tomatoes")
        SUCCESS=$(echo "$RESULT" | jq -r '.successful')
        
        if [ "$SUCCESS" = "true" ]; then
            echo -e "${GREEN}✓ Successfully scraped tomatoes${NC}"
            echo "$RESULT" | jq '{slug, commonName, url, hasCompanions: (.companionSection != null), hasPlantingGuide: (.plantingGuide != null)}'
        else
            echo -e "${RED}✗ Failed to scrape tomatoes${NC}"
            echo "$RESULT" | jq '{slug, errorMessage}'
        fi
        ;;
        
    "top-priority")
        echo -e "\n${YELLOW}3. Scraping top 15 priority plants...${NC}"
        echo "This will take ~50-60 seconds (3 seconds between requests)..."
        echo "Press Ctrl+C to cancel, or wait..."
        
        sleep 2
        
        RESULT=$(curl -s -X POST "$BASE_URL/top-priority")
        TOTAL=$(echo "$RESULT" | jq -r '.totalPlants')
        SUCCESS=$(echo "$RESULT" | jq -r '.successful')
        FAILED=$(echo "$RESULT" | jq -r '.failed')
        
        echo -e "${GREEN}Scraping complete!${NC}"
        echo "Total: $TOTAL, Successful: $SUCCESS, Failed: $FAILED"
        
        echo -e "\nResults:"
        echo "$RESULT" | jq '.results[] | {slug, commonName, successful, hasCompanions: (.companionSection != null)}'
        ;;
        
    "custom")
        echo -e "\n${YELLOW}3. Scraping custom plant list (basil, dill, parsley)...${NC}"
        echo "This will take ~10-12 seconds..."
        
        RESULT=$(curl -s -X POST "$BASE_URL/plants" \
            -H "Content-Type: application/json" \
            -d '{"slugs": ["basil", "dill", "parsley"]}')
        
        TOTAL=$(echo "$RESULT" | jq -r '.totalPlants')
        SUCCESS=$(echo "$RESULT" | jq -r '.successful')
        
        echo -e "${GREEN}Scraping complete!${NC}"
        echo "Total: $TOTAL, Successful: $SUCCESS"
        
        echo -e "\nResults:"
        echo "$RESULT" | jq '.results[] | {slug, commonName, successful, hasCompanions: (.companionSection != null)}'
        ;;
        
    *)
        echo "Usage: $0 [single|top-priority|custom]"
        exit 1
        ;;
esac

echo -e "\n${YELLOW}4. Check output files:${NC}"
echo "Raw HTML: plant-data-aggregator/docs/scrapers/rawhtml/"
echo "JSON data: plant-data-aggregator/docs/scrapers/parsed/"
echo "Reports: plant-data-aggregator/docs/scrapers/reports/"

if [ -d "plant-data-aggregator/docs/scrapers/parsed" ]; then
    FILE_COUNT=$(ls plant-data-aggregator/docs/scrapers/parsed/*.json 2>/dev/null | wc -l)
    echo -e "\n${GREEN}Found $FILE_COUNT scraped JSON files${NC}"
    
    if [ $FILE_COUNT -gt 0 ]; then
        echo -e "\nMost recent file:"
        ls -lt plant-data-aggregator/docs/scrapers/parsed/*.json | head -1
    fi
fi

echo -e "\n${YELLOW}Done!${NC}"
echo "See SCRAPING-GUIDE.md for next steps (LLM parsing)"
