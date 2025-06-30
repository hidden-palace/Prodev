/*
  # Lead Generation System Database Schema

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `business_name` (text)
      - `contact_name` (text)
      - `role_title` (text)
      - `email` (text)
      - `phone` (text)
      - `website` (text)
      - `address` (text)
      - `city` (text)
      - `state` (text)
      - `postal_code` (text)
      - `country` (text)
      - `industry` (text)
      - `categories` (jsonb)
      - `relevance_score` (integer)
      - `contact_role_score` (integer)
      - `location_score` (integer)
      - `completeness_score` (integer)
      - `online_presence_score` (integer)
      - `average_score` (decimal)
      - `validated` (boolean)
      - `outreach_sent` (boolean)
      - `response_received` (boolean)
      - `converted` (boolean)
      - `source_data` (jsonb)
      - `employee_id` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `leads` table
    - Add policies for authenticated users to manage leads
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text,
  role_title text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  state text,
  postal_code text,
  country text DEFAULT 'US',
  industry text,
  categories jsonb DEFAULT '[]'::jsonb,
  relevance_score integer DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 5),
  contact_role_score integer DEFAULT 0 CHECK (contact_role_score >= 0 AND contact_role_score <= 5),
  location_score integer DEFAULT 0 CHECK (location_score >= 0 AND location_score <= 5),
  completeness_score integer DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 5),
  online_presence_score integer DEFAULT 0 CHECK (online_presence_score >= 0 AND online_presence_score <= 5),
  average_score decimal(3,2) DEFAULT 0.0,
  validated boolean DEFAULT false,
  outreach_sent boolean DEFAULT false,
  response_received boolean DEFAULT false,
  converted boolean DEFAULT false,
  source_data jsonb DEFAULT '{}'::jsonb,
  employee_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete leads"
  ON leads
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_employee_id ON leads(employee_id);
CREATE INDEX IF NOT EXISTS idx_leads_average_score ON leads(average_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_validated ON leads(validated);

-- Create function to automatically update average score
CREATE OR REPLACE FUNCTION update_lead_average_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.average_score = (
    COALESCE(NEW.relevance_score, 0) + 
    COALESCE(NEW.contact_role_score, 0) + 
    COALESCE(NEW.location_score, 0) + 
    COALESCE(NEW.completeness_score, 0) + 
    COALESCE(NEW.online_presence_score, 0)
  ) / 5.0;
  
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update average score
CREATE TRIGGER trigger_update_lead_average_score
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_average_score();