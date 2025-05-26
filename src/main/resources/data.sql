-- Insert common plants into the PlantEntity table
INSERT INTO PLANT_ENTITY (id, name, scientific_name, plant_type, maturity_time, growing_season, sun_req, water_req,
                          soil_type, space_req)
VALUES (1, 'Gulrot', 'Daucus carota', 'ROOT_VEGETABLE', 75, 'SPRING', 'Full Sun', 'Moderate', 'Loamy', '5 cm'),
       (2, 'Potet', 'Solanum tuberosum', 'TUBER', 90, 'SPRING', 'Full Sun', 'Moderate', 'Sandy', '30 cm'),
       (3, 'Tomat', 'Solanum lycopersicum', 'FRUIT_VEGETABLE', 85, 'SUMMER', 'Full Sun', 'High', 'Well-drained',
        '50 cm'),
       (4, 'Løk', 'Allium cepa', 'ALLIUM', 110, 'SPRING', 'Full Sun', 'Moderate', 'Well-drained', '10 cm'),
       (5, 'Spinat', 'Spinacia oleracea', 'LEAFY_GREEN', 45, 'SPRING', 'Partial Sun', 'Moderate', 'Loamy', '10 cm'),
       (6, 'Brokkoli', 'Brassica oleracea', 'FLOWERING_PLANT', 100, 'AUTUMN', 'Full Sun', 'Moderate', 'Loamy',
        '40 cm'),
       (7, 'Salat', 'Lactuca sativa', 'LEAFY_GREEN', 50, 'SPRING', 'Partial Sun', 'Moderate', 'Loamy', '20 cm'),
       (8, 'Kål', 'Brassica oleracea var. capitata', 'LEAFY_GREEN', 95, 'SPRING', 'Full Sun', 'Moderate', 'Clay',
        '30 cm'),
       (9, 'Basilikum', 'Ocimum basilicum', 'HERB', 30, 'SUMMER', 'Full Sun', 'Moderate', 'Well-drained', '15 cm'),
       (10, 'Reddik', 'Raphanus sativus', 'ROOT_VEGETABLE', 25, 'SPRING', 'Full Sun', 'Low', 'Well-drained', '5 cm');

ALTER TABLE PLANT_ENTITY
    ALTER COLUMN id RESTART WITH 11;
-- Insert Gardens
INSERT INTO GARDEN_ENTITY (id, name, user_id)
VALUES ('b4389fe3-09cf-49d8-9d61-a04676c1efdf', 'My First Garden', 'f1234abc-5678-90de-abcd-ef1234567890'),
       ('b4389fe3-09cf-49d8-9d61-a04676c1efda', 'Backdoor garden', 'f1234abc-5678-90de-abcd-ef1234567890'),
       ('38df059d-4397-4972-8961-b6a459f29c5e', 'Family Garden', 'a89d5e63-cb23-44c9-ba41-abcdef123456');

-- Insert Grow Zones for "My First Garden" (ID: b4389fe3-09cf-49d8-9d61-a04676c1efdf)
INSERT INTO GROW_ZONE_ENTITY (id, name, zone_size, garden_id, nr_of_rows, notes, zone_type)
VALUES (1, 'Root Area', 'Medium', 'b4389fe3-09cf-49d8-9d61-a04676c1efdf', 4, 'For root vegetables', 'BOX'),
       (2, 'Leafy Area', 'Large', 'b4389fe3-09cf-49d8-9d61-a04676c1efdf', 6, 'For leafy greens', 'BOX'),
       (3, 'Herb Patch', 'Small', 'b4389fe3-09cf-49d8-9d61-a04676c1efdf', 2, 'For growing herbs', 'BUCKET');

-- Insert Grow Zones for "Family Garden" (ID: 38df059d-4397-4972-8961-b6a459f29c5e)
INSERT INTO GROW_ZONE_ENTITY (id, name, zone_size, garden_id, nr_of_rows, notes, zone_type)
VALUES (4, 'Tuber Area', 'Medium', '38df059d-4397-4972-8961-b6a459f29c5e', 4, 'For potatoes and sweet potatoes',
        'TUBER'),
       (5, 'Fruit Area', 'Large', '38df059d-4397-4972-8961-b6a459f29c5e', 6, 'For tomatoes and cucumbers',
        'BED'),
       (6, 'Grain Area', 'Large', '38df059d-4397-4972-8961-b6a459f29c5e', 5, 'For wheat and barley', 'GRAIN'),
       (7, 'Onion Patch', 'Small', '38df059d-4397-4972-8961-b6a459f29c5e', 3, 'For onions and garlic', 'ALLIUM'),
       (8, 'Flower Zone', 'Small', '38df059d-4397-4972-8961-b6a459f29c5e', 2, 'For broccoli and artichokes',
        'BOX');


-- Reset the auto-increment sequence
ALTER TABLE GROW_ZONE_ENTITY
    ALTER COLUMN id RESTART WITH 9;

-- Crop Records (2 per grow zone, using example plants)
-- Root Zone (Grow Zone 1)
INSERT INTO CROP_RECORD_ENTITY (id, name, description, planting_date, harvest_date, plant_id, status, grow_zone_id,
                                outcome, notes)
VALUES ('21af123e-7b6d-4e78-a94b-cd4dc62534ff', 'Carrot Crop', 'Early harvest carrots', '2025-01-01', '2025-04-15', 1,
        'PLANTED', 1, NULL, 'Planted in grow area: 1'),
       ('22ff123e-9b7d-4e67-b94c-ac3bc55655ff', 'Beetroot Batch', 'High-quality seeds', '2025-01-15', '2025-05-20', 2,
        'PLANTED', 1, NULL, 'Planted in grow area: 1');

INSERT INTO CROP_RECORD_ENTITY (id, name, description, planting_date, harvest_date, plant_id, status, grow_zone_id,
                                outcome, notes)
VALUES ('23aa456e-8d9f-4c12-a34b-df5bd78901ef', 'Carrot Crop', 'Fast-growing radishes', '2025-02-10', '2025-04-01', 1,
        'HARVESTED', 1, 'Excellent yield', 'Harvested early due to rapid growth');

-- Leafy Zone (Grow Zone 2)
INSERT INTO CROP_RECORD_ENTITY (id, name, description, planting_date, harvest_date, plant_id, status, grow_zone_id,
                                outcome, notes)
VALUES ('31cd334f-ab8c-45f1-a35c-cc12d25635af', 'Lettuce Variety', 'Mixed lettuce for salads', '2025-02-01',
        '2025-03-15', 3, 'PLANTED', 2, NULL, 'Early growth cycle'),
       ('32ef442a-ab9d-55f2-c36d-dd45d66646ff', 'Kale Yield', 'Robust growth', '2025-02-10', '2025-04-20', 4, 'PLANTED',
        2, NULL, 'Requires less water');

-- Herb Patch (Grow Zone 3)
INSERT INTO CROP_RECORD_ENTITY (id, name, description, planting_date, harvest_date, plant_id, status, grow_zone_id,
                                outcome, notes)
VALUES ('41bc663a-ab4e-67f2-d37e-ed98f77678fb', 'Basil Row', 'Aromatic basil for dishes', '2025-03-05', NULL, 5,
        'GROWING', 3, NULL, 'Harvest when needed'),
       ('42dc772a-ab5e-77f3-e38f-fd09e88789eb', 'Parsley', 'Perfect for garnishing', '2025-03-10', NULL, 6, 'GROWING',
        3, NULL, 'Good sun exposure');

-- Tuber Zone (Grow Zone 4)
INSERT INTO CROP_RECORD_ENTITY (id, name, description, planting_date, harvest_date, plant_id, status, grow_zone_id,
                                outcome, notes)
VALUES ('51aa234a-cd8a-4a78-bc34-af45dd6234ef', 'Potato Crop', 'Early yield potatoes', '2025-02-15', '2025-06-15', 7,
        'PLANTED', 4, 'Good harvest', 'Needs frequent watering'),
       ('52bb345b-de9b-5b67-cd45-bf56ee7345ff', 'Sweet Potato Patch', 'Rich sweet potatoes', '2025-02-20', '2025-07-10',
        8, 'PLANTED', 4, NULL, 'Ensure loose soil');

-- Fruit Zone (Grow Zone 5)
INSERT INTO CROP_RECORD_ENTITY (id, name, description, planting_date, harvest_date, plant_id, status, grow_zone_id,
                                outcome, notes)
VALUES ('61cc456c-efaa-6c78-de56-cb67ff8456ff', 'Tomato Row', 'High-yield cherry tomatoes', '2025-03-01', '2025-07-01',
        9, 'PLANTED', 5, NULL, 'Requires sunny area'),
       ('62dd567d-fabb-7d89-ef67-dc78aa9567ef', 'Cucumber Cluster', 'Perfect slicing cucumbers', '2025-03-05',
        '2025-07-15', 10, 'PLANTED', 5, NULL, 'Needs vine support');

-- Grain Area (Grow Zone 6)
INSERT INTO CROP_RECORD_ENTITY (id, name, description, planting_date, harvest_date, plant_id, status, grow_zone_id,
                                outcome, notes)
VALUES ('71ee678e-baac-8e90-ff78-eb89dd0678ef', 'Wheat Field', 'For baking and cooking', '2025-04-01', '2025-09-01', 7,
        'PLANTED', 6, NULL, 'Requires full sunlight'),
       ('72ff789f-ebbc-9fa1-cc89-fe90cc1789ef', 'Barley Patch', 'Good for brewing and food', '2025-04-15', '2025-09-10',
        2, 'PLANTED', 6, null, 'Handles dry conditions');

-- Onion Patch (Grow Zone 7)
INSERT INTO CROP_RECORD_ENTITY (id, name, description, planting_date, harvest_date, plant_id, status, grow_zone_id,
                                outcome, notes)
VALUES ('81aa890b-accc-afb2-ee90-de01ee2890ef', 'Onion Patch', 'Strong and flavorful onions', '2025-03-20',
        '2025-08-05', 3, 'PLANTED', 7, 'Excellent harvest', 'Grows well in loamy soil'),
       ('82ee901c-cddd-bfc3-ba01-da12ee3901fe', 'Garlic Rows', 'Robust garlic heads', '2025-03-25', '2025-08-10', 4,
        'PLANTED', 7, NULL, 'Ensure dry curing post-harvest');

-- Flower Zone (Grow Zone 8)
INSERT INTO CROP_RECORD_ENTITY (id, name, description, planting_date, harvest_date, plant_id, status, grow_zone_id,
                                outcome, notes)
VALUES ('91aa012a-aeee-cfd4-ee12-bc23aa4902cd', 'Broccoli Head', 'Nutritious and dense heads', '2025-03-15',
        '2025-07-05', 4, 'PLANTED', 8, 'Average yield', 'Requires steady watering'),
       ('92bb123b-afff-dee5-ea23-ab34ee5903dc', 'Artichoke Harvest', 'Tender and edible buds', '2025-03-20',
        '2025-08-15', 2, 'PLANTED', 8, NULL, 'Prune regularly for growth');

