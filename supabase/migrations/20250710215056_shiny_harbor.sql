/*
  # Create Branding System

  1. New Tables
    - `company_branding` - Store company logo and colors
    - `employee_profiles` - Store employee profile pictures
  
  2. Enhanced Leads Table
    - Add missing columns for complete lead data
    
  3. Security
    - Enable RLS on new tables
    - Add policies for admin access
*/

-- Create company branding table
CREATE TABLE IF NOT EXISTS company_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  primary_color text DEFAULT '#ec4899',
  secondary_color text DEFAULT '#64748b',
  accent_color text DEFAULT '#f97316',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create employee profiles table
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
  -- Add source_platform column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'source_platform'
  ) THEN
    ALTER TABLE leads ADD COLUMN source_platform text DEFAULT 'Unknown';
  END IF;

  -- Add role column (rename role_title if it exists)
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

  -- Add phone_number column (rename phone if it exists)
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

-- Enable RLS on new tables
ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for company_branding
CREATE POLICY "Anyone can read branding"
  ON company_branding
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify branding"
  ON company_branding
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Create policies for employee_profiles
CREATE POLICY "Anyone can read employee profiles"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify employee profiles"
  ON employee_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users au
      JOIN roles r ON au.role_id = r.id
      WHERE au.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON leads (source_platform);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads (category);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads (rating);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_employee_id ON employee_profiles (employee_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_branding_updated_at
  BEFORE UPDATE ON company_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();