-- V1__Create_Tables.sql

CREATE TABLE IF NOT EXISTS garden_entity (
    id UUID PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_id UUID
    );

CREATE TABLE IF NOT EXISTS grow_zone_entity (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    zone_size VARCHAR(255),
    garden_id UUID NOT NULL,
    nr_of_rows INT,
    notes TEXT,
    zone_type VARCHAR(255),
    FOREIGN KEY (garden_id) REFERENCES garden_entity(id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS plant_entity (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    plant_type VARCHAR(255),
    maturity_time INT DEFAULT 0,
    growing_season VARCHAR(255),
    sun_req VARCHAR(255),
    water_req VARCHAR(255),
    soil_type VARCHAR(255),
    space_req VARCHAR(255)
    );

CREATE TABLE IF NOT EXISTS crop_record_entity (
    id UUID PRIMARY KEY NOT NULL,
    name VARCHAR(255),
    description TEXT,
    planting_date DATE NOT NULL,
    harvest_date DATE,
    plant_id BIGINT NOT NULL,
    status VARCHAR(255),
    grow_zone_id BIGINT NOT NULL,
    outcome TEXT,
    notes TEXT,
    FOREIGN KEY (plant_id) REFERENCES plant_entity(id) ON DELETE NO ACTION,
    FOREIGN KEY (grow_zone_id) REFERENCES grow_zone_entity(id) ON DELETE CASCADE
    );
