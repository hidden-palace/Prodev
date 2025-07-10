/*
  # Branding and Leads Enhancement Migration
  
  1. New Tables
    - `company_branding` - Store logo and color settings
    - `employee_profiles` - Store employee profile pictures
  
  2. Enhanced Leads Table
    - Add missing columns for comprehensive lead data
    - Add proper constraints and indexes
    - Maintain compatibility with existing data
  
  3. Security
    - Enable RLS on new tables
    - Add admin-only policies for branding management
    - Add read policies for authenticated users
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
  employee_id text NOT NULL,
  profile_picture_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint on employee_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'employee_profiles' 
    AND constraint_name = 'employee_profiles_employee_id_key'
  ) THEN
    ALTER TABLE employee_profiles ADD CONSTRAINT employee_profiles_employee_id_key UNIQUE (employee_id);
  END IF;
END $$;

-- Add missing columns to leads table if they don't exist
DO $$
BEGIN
  -- Add source_platform column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'source_platform'
  ) THEN
    ALTER TABLE leads ADD COLUMN source_platform text DEFAULT 'Unknown';
  END IF;

  -- Add phone_number column (rename from phone if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'phone_number'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'phone'
    ) THEN
      ALTER TABLE leads RENAME COLUMN phone TO phone_number;
    ELSE
      ALTER TABLE leads ADD COLUMN phone_number text;
    END IF;
  END IF;

  -- Add role column (rename from role_title if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'role'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'role_title'
    ) THEN
      ALTER TABLE leads RENAME COLUMN role_title TO role;
    ELSE
      ALTER TABLE leads ADD COLUMN role text;
    END IF;
  END IF;

  -- Add category column (use industry if it exists, otherwise add new)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'category'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'industry'
    ) THEN
      ALTER TABLE leads RENAME COLUMN industry TO category;
    ELSE
      ALTER TABLE leads ADD COLUMN category text;
    END IF;
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

-- Add constraints using proper conditional logic
DO $$
BEGIN
  -- Add rating constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'leads' AND constraint_name = 'chk_leads_rating'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT chk_leads_rating 
    CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));
  END IF;

  -- Add source_platform constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'leads' AND constraint_name = 'chk_leads_source_platform'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT chk_leads_source_platform 
    CHECK (source_platform IN ('LinkedIn', 'Google Business', 'Yelp', 'Unknown'));
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON leads (source_platform);
CREATE INDEX IF NOT EXISTS idx_leads_rating ON leads (rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_category_lower ON leads (lower(category)) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_business_name_lower ON leads (lower(business_name));
CREATE INDEX IF NOT EXISTS idx_leads_source_created ON leads (source_platform, created_at DESC) WHERE source_platform IS NOT NULL;

-- Create GIN index for specialties JSONB column
CREATE INDEX IF NOT EXISTS idx_leads_specialties_gin ON leads USING gin (specialties) WHERE specialties IS NOT NULL;

-- Enable RLS on new tables
ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_branding
DO $$
BEGIN
  -- Policy for reading branding (all authenticated users)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_branding' AND policyname = 'Authenticated users can read branding'
  ) THEN
    CREATE POLICY "Authenticated users can read branding"
      ON company_branding
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Policy for managing branding (admins only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_branding' AND policyname = 'Only admins can manage branding'
  ) THEN
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
  END IF;
END $$;

-- Create RLS policies for employee_profiles
DO $$
BEGIN
  -- Policy for reading employee profiles (all authenticated users)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'employee_profiles' AND policyname = 'Authenticated users can read employee profiles'
  ) THEN
    CREATE POLICY "Authenticated users can read employee profiles"
      ON employee_profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Policy for managing employee profiles (admins only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'employee_profiles' AND policyname = 'Only admins can manage employee profiles'
  ) THEN
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
  END IF;
END $$;

-- Create update triggers for updated_at columns
DO $$
BEGIN
  -- Trigger for company_branding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_company_branding_updated_at'
  ) THEN
    CREATE TRIGGER update_company_branding_updated_at
      BEFORE UPDATE ON company_branding
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Trigger for employee_profiles
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