#!/bin/bash

# Batch Plant Scraping Script
# Usage: ./scrape-batch.sh [batch-name]
# Example: ./scrape-batch.sh high-priority

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         GardenTime Plant Scraper - Batch Mode           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if application is running
echo -n "Checking if application is running... "
if curl -s http://localhost:8081/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${YELLOW}✗ Not running${NC}"
    echo ""
    echo "Please start the application first:"
    echo "  ./gradlew :plant-data-aggregator:bootRun"
    echo ""
    exit 1
fi

echo ""

# Select batch
BATCH_NAME="${1:-high-priority}"

# Get plant list based on batch name
case "$BATCH_NAME" in
    next-vegetables)
        PLANTS="artichokes asparagus celery collards corn edamame fennel horseradish kohlrabi parsnips rhubarb tomatillos turnips"
        ;;
    medium-vegetables-2)
        PLANTS="fava-beans microgreens mustard-greens okra peanuts rutabagas salsify shallots"
        ;;
    specialty)
        PLANTS="turmeric winter-squash"
        ;;
    fruits-1)
        PLANTS="apples blackberries cantaloupes cherries currants elderberries figs gooseberries goji-berries grapes honeydew-melons kiwi lemons peaches"
        ;;
    fruits-2)
        PLANTS="pears plums watermelon"
        ;;
    remaining-herbs)
        PLANTS="ginger lavender marjoram tarragon"
        ;;
    # Legacy batches (already scraped)
    high-priority)
        PLANTS="cilantro-coriander"
        ;;
    medium-vegetables)
        PLANTS="brussels-sprouts cauliflower swiss-chard eggplant leeks scallions arugula bok-choy sweet-potatoes pumpkins"
        ;;
    medium-berries-herbs)
        PLANTS="strawberries raspberries blueberries rosemary sage thyme chives"
        ;;
    *)
        echo "Unknown batch: $BATCH_NAME"
        echo ""
        echo "Available batches (in recommended order):"
        echo ""
        echo "  🔥 NEXT TO SCRAPE:"
        echo "  next-vegetables        - 13 plants (artichokes, asparagus, celery, etc.)"
        echo "  medium-vegetables-2    - 8 plants (fava-beans, mustard-greens, etc.)"
        echo "  specialty              - 2 plants (turmeric, winter-squash)"
        echo "  fruits-1               - 14 plants (apples, blackberries, cherries, etc.)"
        echo "  fruits-2               - 3 plants (pears, plums, watermelon)"
        echo "  remaining-herbs        - 4 plants (ginger, lavender, marjoram, tarragon)"
        echo ""
        echo "  ✅ ALREADY SCRAPED:"
        echo "  high-priority          - 1 plant (cilantro-coriander)"
        echo "  medium-vegetables      - 10 plants (brussels-sprouts, cauliflower, etc.)"
        echo "  medium-berries-herbs   - 7 plants (strawberries, rosemary, etc.)"
        echo ""
        echo "Usage: ./scrape-batch.sh [batch-name]"
        exit 1
        ;;
esac
PLANT_ARRAY=($PLANTS)
PLANT_COUNT=${#PLANT_ARRAY[@]}

echo -e "${BLUE}Batch:${NC} $BATCH_NAME"
echo -e "${BLUE}Plants to scrape:${NC} $PLANT_COUNT"
echo ""

# Estimate time
TIME_EST=$((PLANT_COUNT * 5))
echo -e "${BLUE}Estimated time:${NC} ~${TIME_EST} seconds (~$((TIME_EST / 60)) min)"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Starting batch scrape..."
echo "═══════════════════════════════════════════════════════════"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for PLANT in $PLANTS; do
    echo -n "[$((SUCCESS_COUNT + FAIL_COUNT + 1))/$PLANT_COUNT] Scraping ${PLANT}... "
    
    RESPONSE=$(curl -s -X POST "http://localhost:8081/api/admin/scraping/plant/${PLANT}" 2>/dev/null)
    
    if echo "$RESPONSE" | jq -e '.successful' > /dev/null 2>&1; then
        SUCCESS=$(echo "$RESPONSE" | jq -r '.successful')
        
        if [ "$SUCCESS" = "true" ]; then
            echo -e "${GREEN}✓ Success${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message // "Unknown error"')
            echo -e "${YELLOW}✗ Failed: $ERROR_MSG${NC}"
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    else
        echo -e "${YELLOW}✗ Invalid response${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Wait between requests (polite scraping)
    if [ $((SUCCESS_COUNT + FAIL_COUNT)) -lt $PLANT_COUNT ]; then
        sleep 5
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}Scraping complete!${NC}"
echo ""
echo -e "${BLUE}Results:${NC}"
echo -e "  ✓ Successful: ${GREEN}$SUCCESS_COUNT${NC}"
echo -e "  ✗ Failed:     ${YELLOW}$FAIL_COUNT${NC}"
echo -e "  Total:        $PLANT_COUNT"
echo ""

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. View scraped data:"
    echo "   ls -lt plant-data-aggregator/plant-data-aggregator/docs/scrapers/parsed/ | head -20"
    echo ""
    echo "2. For each plant, parse with LLM:"
    echo "   - Open docs/llm-prompts/QUICK-PROMPT.txt"
    echo "   - Copy plantingGuide and careInstructions from parsed JSON"
    echo "   - Paste into LLM and get structured output"
    echo "   - Save to docs/scrapers/extracted-text/{plant}.json"
    echo ""
    echo "3. Update status:"
    echo "   - Edit docs/plants-we-want-to-scrape-status.md"
    echo "   - Change 🔄 PENDING to ✅ SCRAPED for completed plants"
    echo ""
fi

echo "Done! 🌱"
