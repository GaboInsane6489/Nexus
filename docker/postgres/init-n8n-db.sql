-- ==============================================================================
-- Nexus n8n PostgreSQL Initialization Script
-- Ensures UTF-8 encoding, clean schema permissions, and required extensions
-- for the dedicated n8n orchestration database.
-- ==============================================================================

-- Verify database encoding is UTF8
DO $$
DECLARE
  db_encoding TEXT;
BEGIN
  SELECT pg_encoding_to_char(encoding)
    INTO db_encoding
    FROM pg_database
   WHERE datname = current_database();

  IF db_encoding <> 'UTF8' THEN
    RAISE EXCEPTION 'Database % must use UTF8 encoding (found: %)', current_database(), db_encoding;
  END IF;
END $$;

-- Ensure standard schema ownership & privileges for the configured database role
GRANT USAGE, CREATE ON SCHEMA public TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO CURRENT_USER;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO CURRENT_USER;

-- Enable pgcrypto for UUID / hash utilities if needed by n8n workflows
CREATE EXTENSION IF NOT EXISTS pgcrypto;
