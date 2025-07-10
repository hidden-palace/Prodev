/*
  # Branding and Enhanced Leads Schema

  1. New Tables
    - `company_branding` - Store company logo and color settings
    - `employee_profiles` - Store employee profile pictures
  
  2. Enhanced Leads Table
    - Add missing columns for comprehensive lead data
    - Add proper indexes for performance
    - Add data validation constraints
  
  3. Security
    - Enable RLS on new tables
    - Add policies for admin-only access to branding
    - Add policies for reading employee profiles
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

-- Add new columns to leads table (only if they don't exist)
DO $$
BEGIN
  -- Add source_platform column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'source_platform'
  ) THEN
    ALTER TABLE leads ADD COLUMN source_platform text DEFAULT 'Unknown';
  END IF;

  -- Add role column (rename from role_title if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'role_title'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'role'
  ) THEN
    ALTER TABLE leads RENAME COLUMN role_title TO role;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'role'
  ) THEN
    ALTER TABLE leads ADD COLUMN role text;
  END IF;

  -- Add phone_number column (rename from phone if it exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'phone'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE leads RENAME COLUMN phone TO phone_number;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE leads ADD COLUMN phone_number text;
  END IF;

  -- Add category column
  IF NOT EXISTS (
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

-- Add constraints using DO blocks (NO IF NOT EXISTS syntax)
DO $$
BEGIN
  -- Check and add rating constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'leads' AND constraint_name = 'chk_leads_rating'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT chk_leads_rating 
    CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));
  END IF;

  -- Check and add source_platform constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'leads' AND constraint_name = 'chk_leads_source_platform'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT chk_leads_source_platform 
    CHECK (source_platform IN ('LinkedIn', 'Google Business', 'Yelp', 'Unknown'));
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON leads (source_platform);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads (category);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads (rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_profile_link ON leads (profile_link) WHERE profile_link IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_source_created ON leads (source_platform, created_at DESC) WHERE source_platform IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_business_name_lower ON leads (lower(business_name));

-- GIN index for specialties JSONB
CREATE INDEX IF NOT EXISTS idx_leads_specialties_gin ON leads USING gin (specialties);

-- Enable RLS
ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_branding
CREATE POLICY "Authenticated users can read branding"
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

-- RLS Policies for employee_profiles
CREATE POLICY "Authenticated users can read employee profiles"
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

-- Add triggers for updated_at
CREATE TRIGGER update_company_branding_updated_at
  BEFORE UPDATE ON company_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();