/*
  # Branding and Lead Enhancements

  1. New Tables
    - `company_branding`
      - `id` (uuid, primary key)
      - `logo_url` (text, company logo path)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `employee_profiles`
      - `id` (uuid, primary key)
      - `employee_id` (text, references config employees)
      - `profile_picture_url` (text, profile picture path)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Lead Table Updates
    - Add missing columns for comprehensive lead tracking
    - Update existing leads table structure
    - Add proper indexes for filtering

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
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

ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read branding"
  ON company_branding
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage branding"
  ON company_branding
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create employee profiles table
CREATE TABLE IF NOT EXISTS employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  profile_picture_url text,
  display_name text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read employee profiles"
  ON employee_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage employee profiles"
  ON employee_profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add missing columns to leads table
DO $$
BEGIN
  -- Add source_platform column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'source_platform'
  ) THEN
    ALTER TABLE leads ADD COLUMN source_platform text DEFAULT 'Unknown';
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

  -- Add rating column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'rating'
  ) THEN
    ALTER TABLE leads ADD COLUMN rating numeric(2,1);
  END IF;

  -- Add specialties column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE leads ADD COLUMN specialties jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Rename phone to phone_number for consistency
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'phone'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE leads RENAME COLUMN phone TO phone_number;
  END IF;

  -- Rename role_title to role for consistency
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'role_title'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'role'
  ) THEN
    ALTER TABLE leads RENAME COLUMN role_title TO role;
  END IF;

  -- Rename categories to category for consistency
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'categories'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'category'
  ) THEN
    ALTER TABLE leads RENAME COLUMN categories TO category;
  END IF;
END $$;

-- Add indexes for better filtering performance
CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON leads (source_platform);
CREATE INDEX IF NOT EXISTS idx_leads_created_at_date ON leads (DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads (rating);

-- Add triggers for updated_at
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

-- Insert default branding record
INSERT INTO company_branding (id, logo_url, primary_color, secondary_color, accent_color)
VALUES (gen_random_uuid(), null, '#ec4899', '#64748b', '#f97316')
ON CONFLICT DO NOTHING;

-- Insert default employee profiles
INSERT INTO employee_profiles (employee_id, display_name, bio) VALUES
('brenden', 'AI Brenden', 'Lead Research Specialist - Expert in B2B lead generation and data research'),
('van', 'AI Van', 'Digital Marketing Designer - Creative specialist in landing page design and conversion optimization'),
('angel', 'AI Angel', 'Voice Outreach Manager - Professional voice specialist for customer engagement')
ON CONFLICT (employee_id) DO NOTHING;