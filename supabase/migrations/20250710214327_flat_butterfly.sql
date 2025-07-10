/*
  # Enhanced Branding and Leads System

  1. New Tables
    - `company_branding` - Store company logo and color scheme
    - `employee_profiles` - Store AI employee profile pictures
    
  2. Enhanced Leads Table
    - Add new columns for comprehensive lead data
    - Add proper indexes for performance
    - Update existing columns to match requirements
    
  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data access
    
  4. Performance
    - Add indexes for common query patterns
    - Use only IMMUTABLE functions in indexes
*/

-- Create company_branding table
CREATE TABLE IF NOT EXISTS company_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  primary_color text DEFAULT '#ec4899',
  secondary_color text DEFAULT '#64748b',
  accent_color text DEFAULT '#f97316',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employee_profiles table
CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL UNIQUE,
  profile_picture_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to leads table (using DO block to handle existing columns)
DO $$
BEGIN
  -- Add source_platform column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'source_platform'
  ) THEN
    ALTER TABLE leads ADD COLUMN source_platform text DEFAULT 'Unknown';
  END IF;

  -- Add role column (rename from role_title if exists, otherwise create new)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'role_title'
  ) THEN
    ALTER TABLE leads RENAME COLUMN role_title TO role;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'role'
  ) THEN
    ALTER TABLE leads ADD COLUMN role text;
  END IF;

  -- Add phone_number column (rename from phone if exists, otherwise create new)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'phone'
  ) THEN
    ALTER TABLE leads RENAME COLUMN phone TO phone_number;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE leads ADD COLUMN phone_number text;
  END IF;

  -- Add category column (rename from industry if exists, otherwise create new)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'industry'
  ) THEN
    ALTER TABLE leads RENAME COLUMN industry TO category;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'category'
  ) THEN
    ALTER TABLE leads ADD COLUMN category text;
  END IF;

  -- Add specialties column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE leads ADD COLUMN specialties jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add rating column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'rating'
  ) THEN
    ALTER TABLE leads ADD COLUMN rating numeric(2,1);
  END IF;

  -- Add profile_link column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'profile_link'
  ) THEN
    ALTER TABLE leads ADD COLUMN profile_link text;
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'notes'
  ) THEN
    ALTER TABLE leads ADD COLUMN notes text;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_branding
CREATE POLICY "Anyone can read branding"
  ON company_branding
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage branding"
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

-- Create RLS policies for employee_profiles
CREATE POLICY "Anyone can read employee profiles"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage employee profiles"
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

-- Create indexes for performance (using only IMMUTABLE functions)
-- Note: All these functions are IMMUTABLE and safe for indexes

-- Indexes for company_branding
CREATE INDEX IF NOT EXISTS idx_company_branding_created_at 
  ON company_branding (created_at DESC);

-- Indexes for employee_profiles
CREATE INDEX IF NOT EXISTS idx_employee_profiles_employee_id 
  ON employee_profiles (employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_profiles_created_at 
  ON employee_profiles (created_at DESC);

-- Enhanced indexes for leads table
CREATE INDEX IF NOT EXISTS idx_leads_source_platform 
  ON leads (source_platform) 
  WHERE source_platform IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_category 
  ON leads (category) 
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_rating 
  ON leads (rating DESC) 
  WHERE rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_phone_number 
  ON leads (phone_number) 
  WHERE phone_number IS NOT NULL;

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_leads_source_created 
  ON leads (source_platform, created_at DESC) 
  WHERE source_platform IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_category_rating 
  ON leads (category, rating DESC) 
  WHERE category IS NOT NULL AND rating IS NOT NULL;

-- Text search indexes (using IMMUTABLE lower() function)
CREATE INDEX IF NOT EXISTS idx_leads_business_name_lower 
  ON leads (lower(business_name)) 
  WHERE business_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_contact_name_lower 
  ON leads (lower(contact_name)) 
  WHERE contact_name IS NOT NULL;

-- GIN index for specialties JSONB column
CREATE INDEX IF NOT EXISTS idx_leads_specialties_gin 
  ON leads USING gin (specialties) 
  WHERE specialties IS NOT NULL;

-- Add constraints for data integrity
ALTER TABLE leads 
  ADD CONSTRAINT IF NOT EXISTS chk_leads_rating 
  CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

ALTER TABLE leads 
  ADD CONSTRAINT IF NOT EXISTS chk_leads_source_platform 
  CHECK (source_platform IN ('LinkedIn', 'Google Business', 'Yelp', 'Unknown'));

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
DROP TRIGGER IF EXISTS update_company_branding_updated_at ON company_branding;
CREATE TRIGGER update_company_branding_updated_at
  BEFORE UPDATE ON company_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_profiles_updated_at ON employee_profiles;
CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();