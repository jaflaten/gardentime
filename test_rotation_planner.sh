#!/bin/bash

# Login first
echo "Logging in..."
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Failed to login"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:20}..."

# Get gardens
echo -e "\nGetting gardens..."
GARDEN=$(curl -s -X GET http://localhost:8080/api/gardens \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0]')

GARDEN_ID=$(echo $GARDEN | jq -r '.id')
echo "Garden ID: $GARDEN_ID"

# Get season plans
echo -e "\nGetting season plans..."
SEASON_PLAN=$(curl -s -X GET "http://localhost:8080/api/gardens/$GARDEN_ID/season-plans" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0]')

SEASON_PLAN_ID=$(echo $SEASON_PLAN | jq -r '.id')
echo "Season Plan ID: $SEASON_PLAN_ID"

if [ -z "$SEASON_PLAN_ID" ] || [ "$SEASON_PLAN_ID" = "null" ]; then
  echo "No season plan found, creating one..."
  SEASON_PLAN=$(curl -s -X POST "http://localhost:8080/api/gardens/$GARDEN_ID/season-plans" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"season":"SPRING","year":2025}')
  SEASON_PLAN_ID=$(echo $SEASON_PLAN | jq -r '.id')
  echo "Created Season Plan ID: $SEASON_PLAN_ID"
fi

# Get planned crops
echo -e "\nGetting planned crops..."
PLANNED_CROPS=$(curl -s -X GET "http://localhost:8080/api/gardens/$GARDEN_ID/season-plans/$SEASON_PLAN_ID/planned-crops" \
  -H "Authorization: Bearer $TOKEN")

CROP_COUNT=$(echo $PLANNED_CROPS | jq '. | length')
echo "Found $CROP_COUNT planned crops"

if [ "$CROP_COUNT" -eq 0 ]; then
  echo "No planned crops found, adding test crops..."
  
  # Add some test crops
  curl -s -X POST "http://localhost:8080/api/gardens/$GARDEN_ID/season-plans/$SEASON_PLAN_ID/planned-crops" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"plantId":"1","plantName":"Tomato","quantity":3,"preferredGrowAreaId":null,"phase":"planning","notes":"Test crop"}' > /dev/null
    
  curl -s -X POST "http://localhost:8080/api/gardens/$GARDEN_ID/season-plans/$SEASON_PLAN_ID/planned-crops" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"plantId":"2","plantName":"Lettuce","quantity":5,"preferredGrowAreaId":null,"phase":"planning","notes":"Test crop"}' > /dev/null
    
  echo "Added 2 test crops"
fi

# Run rotation planner
echo -e "\nRunning rotation planner..."
RESULT=$(curl -s -X POST "http://localhost:8080/api/gardens/$GARDEN_ID/season-plans/$SEASON_PLAN_ID/run-rotation-planner" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo -e "\nRotation Planner Result:"
echo $RESULT | jq '.'
