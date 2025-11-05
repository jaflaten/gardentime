# Companion Planting Data Analysis

## Plants in Companion Data (42 plants)
Arugula, Asparagus, Basil, Beans, Beetroot, Broccoli, Brussels Sprouts, Cabbage, Carrot, Cauliflower, Celery, Chamomile, Corn, Cucumber, Dill, Eggplant, Fennel, Garlic, Kale, Leek, Lettuce, Marigold, Mint, Most plants, Nasturtium, Onion, Parsley, Parsnip, Peas, Pepper, Potato, Pumpkin, Radish, Rue, Sage, Spinach, Squash, Strawberries, Swiss Chard, Tomato, Turnip, Zucchini

## Plants in Database (76 plants)
With normalized names for matching.

## Name Mapping Required

### Direct Matches (need minor normalization)
- "Beans" → "Bean"
- "Peas" → "Pea"
- "Strawberries" → "Strawberry Plant"
- "Potato" → "Planting, Growing, and Harvesting Potato"
- "Eggplant" → "Eggplant (Aubergines)"
- "Beetroot" → "Beet"
- "Zucchini" → "Zucchini & Summer Squash"

### Flowers/Herbs Not in Database
- Chamomile (beneficial companion)
- Marigold (beneficial companion)
- Nasturtium (beneficial companion)
- Rue (herb)
- Borage (mentioned in Strawberries data)
- Calendula (mentioned in companion data)
- Petunia (mentioned in companion data)
- Zinnia (mentioned in companion data)
- Lavender (mentioned in companion data)
- Sunflower (mentioned in companion data)

### In Database but NOT in Companion Data (34 plants)
These need companion data compiled:
1. Apple
2. Artichoke
3. Blackberry
4. Blueberry
5. Bok Choy
6. Cantaloupe
7. Cherry
8. Chive
9. Collard Green
10. Currant
11. Edamame
12. Elderberry
13. Fava Bean
14. Fig
15. Goji Berry
16. Gooseberry
17. Grape
18. Green Onions (Scallions)
19. Honeydew Melon
20. Horseradish
21. Kohlrabi
22. Microgreen
23. Mustard Green
24. Okra
25. Oregano
26. Peach
27. Peanut
28. Pear
29. Plum
30. Raspberry
31. Rhubarb
32. Rosemary
33. Salsify
34. Shallot
35. Sweet Potato
36. Thyme Plant
37. Tomatillo
38. Watermelon
39. Rutabaga

### Notes on "Most plants"
- This is a placeholder in companion data
- Should be removed or handled specially during import
- Indicates general compatibility

## Coverage Statistics

- **Companion data coverage:** 42 entries (including non-vegetables)
- **Database plants:** 76
- **Plants with companion data:** ~35-38 (after mapping)
- **Missing companion data:** ~34-38 plants
- **Non-vegetable companions:** ~10 (flowers/herbs not in DB)

## Import Strategy

1. **Create name mapping dictionary** for normalization
2. **Skip non-database plants** (ornamental flowers)
3. **Map database plant names** to companion data keys
4. **Import bidirectional relationships** (if A→B beneficial, then B→A beneficial)
5. **Handle special cases** like "Most plants"
6. **Track unmapped plants** for future data collection

## Priority for Missing Data

### High Priority (common garden vegetables)
- Bok Choy
- Collard Green
- Kohlrabi
- Mustard Green
- Okra
- Oregano
- Rosemary
- Thyme
- Sweet Potato
- Tomatillo

### Medium Priority (fruits/berries)
- Blueberry
- Raspberry
- Grape
- Cantaloupe
- Honeydew Melon
- Watermelon

### Lower Priority (less common)
- Artichoke
- Salsify
- Rutabaga
- Horseradish
- Edamame
- Fava Bean
- Peanut

## Next Steps

1. Create import script with name mapping
2. Import 35-38 plants with companion data
3. Mark which plants still need data
4. User can continue compiling for remaining 34-38 plants
