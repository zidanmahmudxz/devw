-- ============================================================
-- Wafid Slip Manager - Supabase Database Schema
-- Run this SQL in Supabase → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS slips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Appointment Location
  country TEXT,
  city TEXT,
  traveled_country TEXT,

  -- Appointment Type
  appointment_type TEXT DEFAULT 'standard', -- 'standard' | 'premium'
  premium_medical_center TEXT,
  appointment_date TEXT,
  medical_center TEXT,

  -- Candidate Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob TEXT NOT NULL,
  nationality TEXT,
  gender TEXT,
  marital_status TEXT,
  passport TEXT,
  confirm_passport TEXT,
  passport_issue_date TEXT,
  passport_issue_place TEXT,
  passport_expiry_on TEXT,
  visa_type TEXT,
  email TEXT,
  phone TEXT,
  national_id TEXT,
  applied_position TEXT,
  applied_position_other TEXT,

  -- Status & Logs
  status TEXT DEFAULT 'pending', -- 'pending' | 'submitted' | 'error'
  generated_link TEXT,
  log_entries JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS (optional - disable for simplicity)
ALTER TABLE slips ENABLE ROW LEVEL SECURITY;

-- Allow all operations (adjust for production security)
CREATE POLICY "Allow all" ON slips FOR ALL USING (true) WITH CHECK (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_slips_updated_at
  BEFORE UPDATE ON slips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
