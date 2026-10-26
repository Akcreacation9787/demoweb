-- Add profile fields already used by the application schema and profile API.
-- These nullable columns preserve existing profile data.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS address_line_2 TEXT NULL AFTER address,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL AFTER city,
  ADD COLUMN IF NOT EXISTS id_type VARCHAR(50) NULL AFTER postal_code,
  ADD COLUMN IF NOT EXISTS id_proof_path VARCHAR(512) NULL AFTER id_number;
