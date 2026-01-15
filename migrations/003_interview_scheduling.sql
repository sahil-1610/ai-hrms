-- Add scheduled interviews table
CREATE TABLE IF NOT EXISTS scheduled_interviews (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  -- Scheduling details
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'America/New_York',

  -- Google Calendar/Meet integration
  google_event_id TEXT,
  google_meet_link TEXT,
  google_calendar_link TEXT,

  -- Interview details
  interview_type TEXT DEFAULT 'video' CHECK (interview_type IN ('video', 'phone', 'in_person')),
  interviewer_ids UUID[] DEFAULT '{}',
  interviewer_emails TEXT[] DEFAULT '{}',

  -- Status tracking
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled')),

  -- Notes and feedback
  notes TEXT,

  -- Fathom AI integration
  fathom_recording_id TEXT,
  fathom_summary TEXT,
  fathom_transcript TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Add interview scorecards table
CREATE TABLE IF NOT EXISTS interview_scorecards (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  interview_id UUID NOT NULL REFERENCES scheduled_interviews(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES hr_users(id),

  -- Scores (1-5 scale)
  technical_skills INTEGER CHECK (technical_skills BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  problem_solving INTEGER CHECK (problem_solving BETWEEN 1 AND 5),
  cultural_fit INTEGER CHECK (cultural_fit BETWEEN 1 AND 5),
  leadership INTEGER CHECK (leadership BETWEEN 1 AND 5),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),

  -- Recommendation
  recommendation TEXT CHECK (recommendation IN ('strong_yes', 'yes', 'neutral', 'no', 'strong_no')),

  -- Detailed feedback
  strengths TEXT,
  concerns TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add company settings table for career page
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  -- Basic info
  company_name TEXT NOT NULL DEFAULT 'Company Name',
  company_tagline TEXT DEFAULT 'Join our team',
  company_description TEXT,
  company_website TEXT,

  -- Branding
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#8B5CF6',
  background_color TEXT DEFAULT '#F9FAFB',

  -- Career page settings
  career_page_enabled BOOLEAN DEFAULT true,
  career_page_slug TEXT UNIQUE DEFAULT 'careers',
  show_salary_ranges BOOLEAN DEFAULT true,
  show_company_benefits BOOLEAN DEFAULT true,

  -- Benefits list (JSON array)
  benefits JSONB DEFAULT '[]',

  -- Social links
  linkedin_url TEXT,
  twitter_url TEXT,
  glassdoor_url TEXT,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Hero section
  hero_title TEXT DEFAULT 'Join Our Team',
  hero_subtitle TEXT DEFAULT 'Discover exciting opportunities and grow your career with us',
  hero_image_url TEXT,

  -- Google integration tokens (encrypted in production)
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Google tokens to hr_users for per-user calendar integration
ALTER TABLE hr_users
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_email TEXT;

-- Add interview fields to applications if not exists
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS scheduled_interview_id UUID REFERENCES scheduled_interviews(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_application ON scheduled_interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_job ON scheduled_interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_scheduled_at ON scheduled_interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_interviews_status ON scheduled_interviews(status);
CREATE INDEX IF NOT EXISTS idx_interview_scorecards_interview ON interview_scorecards(interview_id);

-- Enable RLS
ALTER TABLE scheduled_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Insert default company settings if not exists
INSERT INTO company_settings (company_name, company_tagline)
VALUES ('AI-HRMS Demo Company', 'Building the future of hiring')
ON CONFLICT DO NOTHING;
