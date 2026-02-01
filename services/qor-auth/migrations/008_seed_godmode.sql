-- Migration: Seed Godmode admin account
-- 
-- This creates the initial God-level admin account for system administration.
-- Username: Godmode
-- Discriminator: 0001
-- Password: 133736988 (will be hashed by application on first run)
--
-- IMPORTANT: The password_hash below is a placeholder. 
-- The actual argon2id hash should be generated securely.

-- First, ensure we have a treasury address for Godmode
-- This address will hold the initial CGT supply and can mint tokens

DO $$
DECLARE
    godmode_id UUID := '00000000-0000-0000-0000-000000000001';
    treasury_address VARCHAR := '0x00000000000000000000000000000000DEMIURGE';
    -- Argon2id hash of "133736988" with standard params
    -- Generated via: argon2.hash('133736988', {type: argon2id})
    -- PLACEHOLDER - replace with actual hash in production
    password_hash VARCHAR := '$argon2id$v=19$m=65536,t=3,p=4$c2VjdXJlc2FsdA$placeholder';
BEGIN
    -- Insert Godmode account if not exists
    INSERT INTO users (
        id,
        email,
        username,
        discriminator,
        password_hash,
        email_verified,
        avatar_url,
        role,
        status,
        on_chain_address,
        backup_code,
        primary_pubkey,
        auth_method,
        account_type,
        created_at,
        updated_at
    ) VALUES (
        godmode_id,
        'godmode@demiurge.cloud',
        'godmode',
        1,
        password_hash,
        TRUE,
        NULL,
        'god',
        'active',
        treasury_address,
        'GODMODE-RECOVERY-2026',
        NULL,
        'password',
        'human',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'god',
        status = 'active',
        updated_at = NOW();
    
    -- Log the creation
    RAISE NOTICE 'Godmode account created/updated with ID: %', godmode_id;
END $$;

-- Create index for fast God-level lookups
CREATE INDEX IF NOT EXISTS idx_users_god_role ON users(role) WHERE role = 'god';

-- Add comment
COMMENT ON TABLE users IS 'User accounts including the Godmode admin (id=00000000-0000-0000-0000-000000000001)';
