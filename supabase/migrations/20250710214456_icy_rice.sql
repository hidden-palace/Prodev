/*
  # Fix Branding and Leads Schema Updates

  1. New Tables
    - `company_branding` - Store logo and brand colors
    - `employee_profiles` - Store employee profile pictures
  
  2. Leads Table Updates
    - Add missing columns that align with the requirements
    - Add proper indexes for performance
    - Maintain existing data structure
  
  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Create company_branding table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  primary_color text DEFAULT '#ec4899',
  secondary_color text DEFAULT '#64748b',
  accent_color text DEFAULT '#f97316',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employee_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL UNIQUE,
  profile_picture_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to leads table (only if they don't exist)
DO $$
BEGIN
  -- Add source_platform if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'source_platform'
  ) THEN
    ALTER TABLE leads ADD COLUMN source_platform text;
  END IF;

  -- Add role column (rename from role_title if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'role'
  ) THEN
    -- Check if role_title exists and rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'role_title'
    ) THEN
      ALTER TABLE leads RENAME COLUMN role_title TO role;
    ELSE
      ALTER TABLE leads ADD COLUMN role text;
    END IF;
  END IF;

  -- Add phone_number column (rename from phone if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'phone_number'
  ) THEN
    -- Check if phone exists and rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'phone'
    ) THEN
      ALTER TABLE leads RENAME COLUMN phone TO phone_number;
    ELSE
      ALTER TABLE leads ADD COLUMN phone_number text;
    END IF;
  END IF;

  -- Add category column (different from existing categories jsonb)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'category'
  ) THEN
    ALTER TABLE leads ADD COLUMN category text;
  END IF;

  -- Add specialties column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE leads ADD COLUMN specialties jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add rating column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'rating'
  ) THEN
    ALTER TABLE leads ADD COLUMN rating numeric(2,1);
  END IF;

  -- Add profile_link column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'profile_link'
  ) THEN
    ALTER TABLE leads ADD COLUMN profile_link text;
  END IF;

  -- Add notes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'notes'
  ) THEN
    ALTER TABLE leads ADD COLUMN notes text;
  END IF;
END $$;

-- Add constraints for data integrity
DO $$
BEGIN
  -- Add rating constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'chk_leads_rating'
  ) THEN
    ALTER TABLE leads 
      ADD CONSTRAINT chk_leads_rating 
      CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));
  END IF;

  -- Add source platform constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'chk_leads_source_platform'
  ) THEN
    ALTER TABLE leads 
      ADD CONSTRAINT chk_leads_source_platform 
      CHECK (source_platform IS NULL OR source_platform IN ('LinkedIn', 'Google Business', 'Yelp', 'Unknown'));
  END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON leads (source_platform);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads (category);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads (rating DESC) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_source_created ON leads (source_platform, created_at DESC) WHERE source_platform IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_business_name_search ON leads (lower(business_name));

-- GIN index for specialties JSONB column
CREATE INDEX IF NOT EXISTS idx_leads_specialties_gin ON leads USING gin (specialties);

-- Enable RLS on new tables
ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for company_branding (allow all authenticated users to read, only admins to modify)
CREATE POLICY IF NOT EXISTS "Anyone can read branding"
  ON company_branding
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Only admins can modify branding"
  ON company_branding
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin' AND au.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin' AND au.deleted_at IS NULL
    )
  );

-- Create policies for employee_profiles (allow all authenticated users to read, only admins to modify)
CREATE POLICY IF NOT EXISTS "Anyone can read employee profiles"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Only admins can modify employee profiles"
  ON employee_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin' AND au.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin' AND au.deleted_at IS NULL
    )
  );

-- Create update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_company_branding_updated_at'
  ) THEN
    CREATE TRIGGER update_company_branding_updated_at
      BEFORE UPDATE ON company_branding
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_employee_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_employee_profiles_updated_at
      BEFORE UPDATE ON employee_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;