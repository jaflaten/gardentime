#!/bin/bash

BASE_URL="http://localhost:8081/api/v1/plant-data"

echo "Testing Plant Data API"
echo "======================"
echo ""

echo "1. GET /plants (first 5 plants)"
curl -s "${BASE_URL}/plants?page=0&size=5" | jq '.plants[0:2] | .[] | {name, scientificName, family}'
echo ""

echo "2. Search for 'tomato'"
curl -s "${BASE_URL}/plants/search?q=tomato" | jq '.[0:2] | .[] | {name, scientificName, family}'
echo ""

echo "3. Get plant by name 'Tomato'"
curl -s "${BASE_URL}/plants/Tomato" | jq '{name, scientificName, family, cycle, companionCount}'
echo ""

echo "4. List all families"
curl -s "${BASE_URL}/families" | jq '.families[0:5] | .[] | {name, plantCount, examplePlants: .examplePlants[0:2]}'
echo ""

echo "5. Get plants in Solanaceae family"
curl -s "${BASE_URL}/families/Solanaceae/plants" | jq '{familyName, plantCount, plants: .plants[0:3] | map(.name)}'
echo ""

echo "6. Get companions for 'Tomato'"
curl -s "${BASE_URL}/plants/Tomato/companions" | jq '{plant: .plant.name, beneficial: .companions.beneficial[0:3] | map(.name)}'
echo ""

echo "7. Check compatibility"
curl -s -X POST "${BASE_URL}/companions/check" \
  -H "Content-Type: application/json" \
  -d '{"plantNames": ["Tomato", "Basil"]}' | jq '{compatible, relationships: .relationships | map({plant1, plant2, relationship})}'
echo ""

echo "8. Bulk get plants"
curl -s -X POST "${BASE_URL}/plants/bulk" \
  -H "Content-Type: application/json" \
  -d '{"plantNames": ["Tomato", "Basil", "Carrot", "NonExistent"]}' | jq '{found: .plants | length, notFound}'
echo ""

echo "Done!"
