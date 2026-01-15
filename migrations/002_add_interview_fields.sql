-- Migration: Add interview fields to applications table
-- Run this migration after the Phase 2 implementation

-- Add interview-related columns to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS interview_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS interview_audio_url TEXT,
ADD COLUMN IF NOT EXISTS interview_transcript TEXT,
ADD COLUMN IF NOT EXISTS interview_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_evaluation JSONB;

-- Create index for interview token lookups
CREATE INDEX IF NOT EXISTS idx_applications_interview_token 
ON applications(interview_token) 
WHERE interview_token IS NOT NULL;

-- Update the RLS policy to allow public access via interview_token
DROP POLICY IF EXISTS "Public can access by interview_token" ON applications;
CREATE POLICY "Public can access by interview_token" ON applications
FOR SELECT
USING (interview_token IS NOT NULL);

-- Example of how to query for interview tokens
COMMENT ON COLUMN applications.interview_token IS 'Unique token for candidate interview access';
COMMENT ON COLUMN applications.interview_audio_url IS 'Cloudinary URL for interview recording';
COMMENT ON COLUMN applications.interview_transcript IS 'AI-transcribed text from interview';
COMMENT ON COLUMN applications.interview_completed_at IS 'Timestamp when interview was submitted';
COMMENT ON COLUMN applications.ai_evaluation IS 'JSON containing AI evaluation of interview';
