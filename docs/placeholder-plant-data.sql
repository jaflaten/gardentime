-- Placeholder Plant Data for Season Planning Feature
-- 20 common vegetables and herbs with indoor starting information
-- This data will later be replaced/enhanced by plant-data-aggregator API

-- Note: This assumes plant_details table exists and has been extended with new columns
-- Run this AFTER the migration that adds the new columns to plant_details

-- Tomato (Classic greenhouse/garden crop)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Tomato' LIMIT 1), 
 7, false, true, 'TENDER',
 'Start seeds in seed trays or small pots indoors. Keep soil warm (21-24°C) for germination.',
 'Harden off for 7-10 days before transplanting. Plant after all frost danger has passed. Space 60-90cm apart.');

-- Pepper (Capsicum - also needs indoor start)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Pepper' LIMIT 1), 
 8, false, true, 'TENDER',
 'Start seeds 8-10 weeks before last frost. Requires warm soil (24-27°C) for germination.',
 'Harden off gradually. Plant out 2 weeks after last frost when soil is warm. Space 45-60cm apart.');

-- Lettuce (Can do both)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Lettuce' LIMIT 1), 
 4, true, true, 'HARDY',
 'Can start indoors 4-6 weeks before last frost for early crop.',
 'Transplant when 2-3 true leaves appear. Can handle light frost. Space 20-30cm apart.');

-- Carrot (Direct sow only)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Carrot' LIMIT 1), 
 NULL, true, false, 'HARDY',
 NULL,
 'Carrots do not transplant well. Direct sow 2-3 weeks before last frost. Thin to 5-7cm apart.');

-- Cucumber (Tender crop)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Cucumber' LIMIT 1), 
 3, true, true, 'TENDER',
 'Start indoors 3-4 weeks before last frost in individual pots to avoid root disturbance.',
 'Plant out after all frost danger. Cucumbers dislike root disturbance, so handle carefully.');

-- Basil (Popular herb, tender)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Basil' LIMIT 1), 
 6, true, true, 'TENDER',
 'Start seeds 6-8 weeks before last frost. Needs warmth (21°C+) to germinate.',
 'Very frost-sensitive. Plant out when nights consistently above 10°C. Space 20-30cm apart.');

-- Kale (Very hardy)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Kale' LIMIT 1), 
 4, true, true, 'HARDY',
 'Start indoors 4-6 weeks before planting out for early harvest.',
 'Very frost tolerant. Can plant out 4-6 weeks before last frost. Space 30-45cm apart.');

-- Spinach (Cold-loving leafy green)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Spinach' LIMIT 1), 
 3, true, true, 'HARDY',
 'Can start indoors for early spring crop, but direct sowing is easier.',
 'Transplant carefully as spinach has delicate roots. Plant 4-6 weeks before last frost.');

-- Radish (Fast-growing, direct sow)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Radish' LIMIT 1), 
 NULL, true, false, 'HARDY',
 NULL,
 'Direct sow only. Can be planted 4-6 weeks before last frost. Mature in 3-4 weeks.');

-- Broccoli (Cool season crop)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Broccoli' LIMIT 1), 
 5, true, true, 'HARDY',
 'Start indoors 5-7 weeks before last frost for spring crop.',
 'Transplant 2-4 weeks before last frost. Broccoli tolerates light frost. Space 45-60cm apart.');

-- Zucchini/Courgette (Summer squash)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Zucchini' LIMIT 1), 
 2, true, true, 'TENDER',
 'Start indoors 2-3 weeks before last frost if desired, but direct sowing works well.',
 'Plant out after frost danger. Zucchini grows fast. Space 60-90cm apart.');

-- Peas (Cool season, direct sow)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Pea' LIMIT 1), 
 NULL, true, false, 'HARDY',
 NULL,
 'Direct sow 4-6 weeks before last frost. Peas prefer cool weather and do not transplant well.');

-- Beans (Warm season, direct sow)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Bean' LIMIT 1), 
 NULL, true, false, 'TENDER',
 NULL,
 'Direct sow after last frost when soil is warm. Beans do not transplant well. Space 10-15cm apart.');

-- Onion (Long season crop)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Onion' LIMIT 1), 
 8, true, true, 'HARDY',
 'Start from seed 8-10 weeks before last frost, or use onion sets for easier growing.',
 'Transplant 4 weeks before last frost. Onions are frost-hardy. Space 10-15cm apart.');

-- Parsley (Biennial herb)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Parsley' LIMIT 1), 
 6, true, true, 'HARDY',
 'Start indoors 6-8 weeks before last frost. Seeds are slow to germinate (2-4 weeks).',
 'Transplant after last frost. Parsley is moderately frost-tolerant. Space 15-20cm apart.');

-- Cilantro/Coriander (Quick-growing herb)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Cilantro' LIMIT 1), 
 3, true, true, 'HARDY',
 'Can start indoors 3-4 weeks before last frost, but cilantro prefers direct sowing.',
 'Transplant carefully if started indoors. Cilantro has a taproot. Plant 2 weeks before last frost.');

-- Eggplant/Aubergine (Long season, warm crop)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Eggplant' LIMIT 1), 
 8, false, true, 'TENDER',
 'Start 8-10 weeks before last frost. Requires very warm soil (24-27°C) to germinate.',
 'Very frost-sensitive. Plant out 2-3 weeks after last frost when soil is warm. Space 60cm apart.');

-- Squash (Winter squash, pumpkin)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Squash' LIMIT 1), 
 3, true, true, 'TENDER',
 'Can start indoors 3-4 weeks before last frost in individual pots.',
 'Transplant after frost danger. Squash has sensitive roots. Space 90-120cm apart for vining types.');

-- Cauliflower (Cool season, challenging)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Cauliflower' LIMIT 1), 
 5, true, true, 'SEMI_HARDY',
 'Start indoors 5-7 weeks before last frost for spring crop.',
 'Transplant 2-4 weeks before last frost. Cauliflower is sensitive to temperature stress. Space 45-60cm apart.');

-- Cabbage (Cool season, hardy)
INSERT INTO plant_details (plant_id, weeks_before_frost_indoor, can_direct_sow, can_transplant, frost_tolerance, indoor_start_method, transplant_guidance)
VALUES 
((SELECT id FROM plants WHERE name = 'Cabbage' LIMIT 1), 
 5, true, true, 'HARDY',
 'Start indoors 5-7 weeks before last frost for early crop.',
 'Very frost-hardy. Transplant 4 weeks before last frost. Space 30-45cm apart depending on variety.');

-- Notes:
-- 1. weeks_before_frost_indoor: Number of weeks to start seeds indoors before last frost date
-- 2. can_direct_sow: Whether the plant can be planted directly in the garden
-- 3. can_transplant: Whether the plant can be started indoors and transplanted
-- 4. frost_tolerance: HARDY (can handle frost), SEMI_HARDY (light frost ok), TENDER (no frost)
-- 5. indoor_start_method: Instructions for starting seeds indoors
-- 6. transplant_guidance: When and how to transplant to the garden

-- These plants can be used to test the season planning feature
-- The plant-data-aggregator will eventually provide more detailed and accurate data
