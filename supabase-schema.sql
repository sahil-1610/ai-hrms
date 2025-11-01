-- AI-Powered HRMS Database Schema
-- This SQL should be run in Supabase SQL Editor
-- 
-- IMPORTANT: This is an INTERNAL HR system
-- - Only HR/Admin users have accounts (pre-seeded)
-- - Candidates DO NOT create accounts
-- - Candidates access via unique tokens (for applications and tests)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For gen_random_bytes
CREATE EXTENSION IF NOT EXISTS "vector"; -- For pgvector (embeddings)

-- HR Users Table (Internal staff only)
CREATE TABLE IF NOT EXISTS hr_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'hr' CHECK (role IN ('hr', 'admin')),
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  location TEXT,
  experience_min INTEGER DEFAULT 0,
  experience_max INTEGER DEFAULT 10,
  skills TEXT[] DEFAULT '{}',
  salary_range TEXT,
  jd_text TEXT NOT NULL,
  ai_generated BOOLEAN DEFAULT FALSE,
  jd_embedding VECTOR(3072), -- OpenAI text-embedding-3-large dimension
  created_by UUID REFERENCES hr_users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications Table (Candidates don't need accounts - all data stored here)
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- Candidate Information (from resume/form - NO user account)
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  current_company TEXT,
  experience INTEGER, -- years of experience
  skills TEXT[] DEFAULT '{}',
  education TEXT,
  cover_letter TEXT,
  
  -- Resume Storage
  resume_url TEXT, -- S3/Cloudinary URL
  resume_text TEXT, -- Extracted text for embeddings
  resume_embedding VECTOR(3072),
  
  -- Audio Interview
  audio_url TEXT,
  transcript TEXT,
  
  -- Scores
  resume_match_score INTEGER DEFAULT 0, -- 0-100 based on embedding similarity
  test_score INTEGER DEFAULT 0, -- 0-100 from MCQ test
  communication_score INTEGER DEFAULT 0, -- 0-100 from transcript evaluation
  overall_score INTEGER DEFAULT 0, -- Weighted average
  
  -- Status Management
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'shortlisted', 'rejected', 'interviewing', 'offered', 'hired')),
  
  -- Token-based Access (NO LOGIN REQUIRED)
  application_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'), -- Unique token for candidate access
  test_token TEXT UNIQUE, -- Generated when HR invites to test
  interview_token TEXT UNIQUE, -- Generated when HR invites to interview
  
  -- Test Tracking
  test_taken_at TIMESTAMP WITH TIME ZONE,
  interview_taken_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tests Table
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  questions JSONB NOT NULL, -- Array of {q, options, correctIndex}
  created_by UUID REFERENCES hr_users(id),
  duration_minutes INTEGER DEFAULT 30,
  passing_score INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Submissions Table
CREATE TABLE IF NOT EXISTS test_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES tests(id),
  answers JSONB NOT NULL, -- Array of selected indices
  score INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_overall_score ON applications(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_applications_application_token ON applications(application_token);
CREATE INDEX IF NOT EXISTS idx_applications_test_token ON applications(test_token);
CREATE INDEX IF NOT EXISTS idx_applications_interview_token ON applications(interview_token);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_tests_job_id ON tests(job_id);
CREATE INDEX IF NOT EXISTS idx_hr_users_email ON hr_users(email);

-- Row Level Security (RLS)
ALTER TABLE hr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- HR Users: Can only view themselves and other HR (admin can see all)
CREATE POLICY "HR users can view own profile" ON hr_users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "HR users can update own profile" ON hr_users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage HR users" ON hr_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role = 'admin')
  );

-- Jobs: Public can read active jobs, only HR can create/edit
CREATE POLICY "Public can view active jobs" ON jobs
  FOR SELECT USING (status = 'active');

CREATE POLICY "HR can view all jobs" ON jobs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role IN ('hr', 'admin'))
  );

CREATE POLICY "HR can create jobs" ON jobs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role IN ('hr', 'admin'))
  );

CREATE POLICY "HR can update jobs" ON jobs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role IN ('hr', 'admin'))
  );

CREATE POLICY "HR can delete jobs" ON jobs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role IN ('hr', 'admin'))
  );

-- Applications: Public can create, HR can view/update
CREATE POLICY "Public can create applications" ON applications
  FOR INSERT WITH CHECK (true); -- No auth required to apply

CREATE POLICY "HR can view all applications" ON applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role IN ('hr', 'admin'))
  );

CREATE POLICY "HR can update applications" ON applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role IN ('hr', 'admin'))
  );

CREATE POLICY "HR can delete applications" ON applications
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role IN ('hr', 'admin'))
  );

-- Tests: Only HR can manage tests
CREATE POLICY "HR can manage tests" ON tests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role IN ('hr', 'admin'))
  );

-- Test Submissions: Only HR can view
CREATE POLICY "HR can view test submissions" ON test_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid() AND role IN ('hr', 'admin'))
  );

-- Functions

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_hr_users_updated_at BEFORE UPDATE ON hr_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate secure tokens
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to check if email has already applied to a job
CREATE OR REPLACE FUNCTION check_duplicate_application(p_email TEXT, p_job_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM applications 
    WHERE email = p_email AND job_id = p_job_id
  );
END;
$$ LANGUAGE plpgsql;
