-- V13__add_password_reset_fields.sql

ALTER TABLE user_entity 
ADD COLUMN password_reset_token VARCHAR(255),
ADD COLUMN password_reset_token_expiry TIMESTAMP;

CREATE INDEX idx_user_password_reset_token ON user_entity(password_reset_token);
