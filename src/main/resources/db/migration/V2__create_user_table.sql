-- V2__create_user_table.sql

CREATE TABLE IF NOT EXISTS user_entity (
    id UUID PRIMARY KEY NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id to garden_entity table
ALTER TABLE garden_entity
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE garden_entity
    ADD CONSTRAINT fk_garden_user
    FOREIGN KEY (user_id) REFERENCES user_entity(id) ON DELETE CASCADE;

-- Create index on user_id for better query performance
CREATE INDEX idx_garden_user_id ON garden_entity(user_id);
CREATE INDEX idx_user_email ON user_entity(email);
CREATE INDEX idx_user_username ON user_entity(username);

