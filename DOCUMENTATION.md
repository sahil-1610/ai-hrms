# AI-HRMS - Complete Project Documentation

> Last Updated: January 2026

## Executive Summary

**AI-Powered HRMS** is a comprehensive recruitment management system that leverages AI to automate the entire hiring process from job posting to candidate evaluation. The system is designed as an internal HR tool where only HR staff have accounts, while candidates interact via secure token-based access.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, TailwindCSS 4, Shadcn/UI |
| Backend | Next.js API Routes (Serverless) |
| Database | Supabase (PostgreSQL with pgvector for embeddings) |
| Authentication | NextAuth.js (Credentials-based for HR only) |
| AI | OpenAI (GPT-4o-mini, text-embedding-3-large, Whisper) |
| Storage | Cloudinary (resumes, interview recordings) |
| Email | Nodemailer (SMTP/Gmail) |
| Calendar | Google Calendar API with Google Meet integration |

---

## Database Schema

### Core Tables

#### 1. hr_users
HR/Admin users only (no candidate accounts)
- `id`, `email`, `name`, `role` (hr/admin), `password_hash`, `is_active`
- `google_access_token`, `google_refresh_token`, `google_email` (for calendar integration)

#### 2. jobs
Job postings with AI capabilities
- Basic: `id`, `title`, `location`, `experience_min`, `experience_max`, `skills[]`, `salary_range`
- Content: `jd_text`, `jd_embedding` (vector 3072)
- Config: `status` (draft/active/closed), `pipeline_config` (JSONB), `mcq_config` (JSONB), `interview_questions` (JSONB)

#### 3. applications
Candidate applications with token-based access
- **Candidate Info:** `name`, `email`, `phone`, `current_company`, `experience`, `skills[]`, `education`, `cover_letter`
- **Resume:** `resume_url`, `resume_text`, `resume_embedding` (vector 3072)
- **Scores:** `resume_match_score`, `test_score`, `communication_score`, `overall_score`
- **Pipeline:** `current_stage`, `stage_history` (JSONB), `status`
- **Tokens:** `application_token`, `test_token`, `interview_token`
- **Interview:** `interview_audio_url`, `interview_transcript`, `interview_completed_at`, `ai_evaluation` (JSONB)

#### 4. tests
MCQ tests per job
- `id`, `job_id`, `questions` (JSONB array), `duration_minutes`, `passing_score`, `created_by`

#### 5. scheduled_interviews
Live interview scheduling
- `scheduled_at`, `duration_minutes`, `timezone`, `interview_type`
- Google: `google_event_id`, `google_meet_link`, `google_calendar_link`
- `interviewer_ids[]`, `interviewer_emails[]`
- `status`: scheduled/completed/cancelled/no_show/rescheduled

#### 6. interview_scorecards
Interviewer feedback
- Skills: `technical_skills`, `communication`, `problem_solving`, `cultural_fit`, `leadership` (1-5)
- `overall_rating`, `recommendation` (strong_yes/yes/neutral/no/strong_no)

#### 7. company_settings
Career page branding
- Branding: `logo_url`, `primary_color`, `secondary_color`, `hero_image_url`
- Content: `benefits[]`, social links, SEO metadata

#### 8. job_interview_questions
Custom interview questions per job
- `job_id`, `question`, `order_index`, `max_duration_seconds`, `category`, `is_required`

---

## API Routes (27 Endpoints)

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST/GET | `/api/auth/[...nextauth]` | NextAuth configuration |
| GET | `/api/auth/google/connect` | Initiate Google OAuth for calendar |
| GET | `/api/auth/google/callback` | Handle Google OAuth callback |

### Jobs Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/jobs` | List jobs | Public (active) / HR (all) |
| POST | `/api/jobs` | Create job | HR/Admin |
| GET | `/api/jobs/[id]` | Get job details | Public |
| PATCH | `/api/jobs/[id]` | Update job | HR/Admin |
| DELETE | `/api/jobs/[id]` | Delete job | HR/Admin |
| POST | `/api/jobs/generate-jd` | AI job description | HR/Admin |
| GET | `/api/jobs/[id]/pipeline` | Get pipeline config | HR/Admin |
| PUT | `/api/jobs/[id]/pipeline` | Update pipeline | HR/Admin |
| GET | `/api/jobs/[id]/interview-questions` | Get interview Qs | Public |

### Applications Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/applications` | List applications | Token/HR |
| GET | `/api/applications/[id]` | Get application | HR/Admin |
| POST | `/api/jobs/[id]/apply` | Submit application | Public |
| POST | `/api/applications/[id]/analyze` | Analyze resume | HR/Admin |
| POST | `/api/applications/[id]/reanalyze` | Re-analyze | HR/Admin |
| POST | `/api/applications/[id]/advance` | Advance stage | HR/Admin |
| PATCH | `/api/applications/[id]/status` | Update status | HR/Admin |
| POST | `/api/parse-resume` | Parse resume file | Public |

### Testing System
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tests/generate` | Generate MCQ test | HR/Admin |
| GET | `/api/tests/generate` | Get test for job | HR/Admin |
| DELETE | `/api/tests/generate` | Delete test | HR/Admin |
| POST | `/api/tests/submit` | Submit answers | Token |
| POST | `/api/tests/invite` | Invite to test | HR/Admin |

### Interview System
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/interview/invite` | Invite to async interview | HR/Admin |
| POST | `/api/interview/submit` | Submit recording | Token |
| POST | `/api/interviews/schedule` | Schedule live interview | HR/Admin |
| GET | `/api/interviews/schedule` | Get scheduled interviews | HR/Admin |

### Company Settings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/company/settings` | Get settings | Public |
| PUT | `/api/company/settings` | Update settings | HR/Admin |
| GET | `/api/hr/me` | Get current HR user | HR/Admin |

---

## Frontend Pages

### Public Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page with features |
| `/careers` | Branded career site |
| `/careers/jobs/[id]` | Job details |
| `/careers/jobs/[id]/apply` | Application form |
| `/careers/jobs/[id]/apply/success` | Confirmation page |
| `/status/[token]` | Track application status |
| `/test/[token]` | Take MCQ test |
| `/interview/[token]` | Record async interview |

### Admin Pages (HR Only)
| Route | Description |
|-------|-------------|
| `/admin/dashboard` | Stats, charts, overview |
| `/admin/jobs` | Job management |
| `/admin/jobs/create` | Create new job |
| `/admin/jobs/[id]/edit` | Edit job & pipeline |
| `/admin/jobs/[id]/candidates` | View candidates for job |
| `/admin/candidates` | All candidates |
| `/admin/candidates/[id]` | Candidate detail |
| `/admin/settings` | Company & branding settings |
| `/auth/signin` | HR login |

---

## Core Library Functions

### OpenAI Integration (`lib/openai.js`)
- `generateEmbedding(text)` - Vector embeddings (3072 dimensions)
- `generateJobDescription({...})` - AI JD generation
- `parseResume(resumeText)` - Structured resume parsing
- `generateMCQ({...})` - Test question generation
- `transcribeAudio(audioFile)` - Whisper transcription
- `evaluateTranscript(transcript, question)` - Interview evaluation
- `matchResumeToJob(resumeText, jobDescription)` - AI matching

### Resume Parsing (`lib/resumeParser.js`)
- `extractTextFromPDF(buffer)` - PDF text extraction
- `extractTextFromDOCX(buffer)` - DOCX text extraction

### Cloudinary (`lib/cloudinary.js`)
- `uploadToCloudinary(fileBuffer, fileName, folder)` - File upload
- `deleteFromCloudinary(publicId)` - File deletion

### Email System (`lib/email.js`)
- `sendEmail({to, subject, html, text})` - Send notifications
- Templates: confirmation, shortlisted, rejected, test invite, interview invite, offer, hired

### Google Calendar (`lib/google.js`)
- `getGoogleAuthUrl()` - OAuth URL
- `createCalendarEventWithMeet({...})` - Create event with Meet
- `getAvailableSlots({...})` - Find free time slots

### Pipeline Management (`lib/pipeline.js`)
- `checkAndAutoAdvance(applicationId, currentStage, score)` - Auto-advancement
- `calculateOverallScore(application, pipelineConfig)` - Weighted scoring
- `getNextStage(currentStage, pipelineConfig)` - Get next stage

---

## Pipeline Stages & Scoring

### Pipeline Stages
1. `resume_screening` (auto-advance threshold: 60%)
2. `mcq_test` (auto-advance threshold: 60%)
3. `async_interview` (auto-advance threshold: 50%)
4. `live_interview` (manual)
5. `offer` (manual)
6. `hired` / `rejected` (terminal states)

### Scoring Algorithm
```
overall_score = weighted_average(
  resume_match_score × 0.4,
  mcq_score × 0.3,
  interview_score × 0.2,
  live_interview_score × 0.1
)
```
*Weights are configurable per job via pipeline_config*

---

## Authentication System

**HR Users:** Email/password via NextAuth.js
**Candidates:** Token-based access (no accounts required)

| Token Type | Purpose |
|------------|---------|
| `application_token` | Track application status |
| `test_token` | Access MCQ test |
| `interview_token` | Record async interview |

**Roles:**
- `admin` - Full access, manage HR users
- `hr` - Manage jobs, candidates, interviews

**Default Credentials (from seed):**
- admin@company.com / Admin@123 (admin)
- hr@company.com / Admin@123 (hr)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# OpenAI
OPENAI_API_KEY=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email
EMAIL_USER=
EMAIL_PASSWORD=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Feature Status

### Fully Implemented (85%)
- [x] Job Management (CRUD, AI JD generation, embeddings)
- [x] Application System (form, resume upload, confirmation)
- [x] AI Resume Analysis (parsing, embeddings, matching)
- [x] MCQ Testing System (generation, timed tests, auto-grading)
- [x] Async Interview (recording, transcription, evaluation)
- [x] Live Interview Scheduling (Google Calendar, Meet)
- [x] Pipeline Management (stages, auto-advancement, scoring)
- [x] Admin Dashboard (stats, charts)
- [x] Candidate Management (list, detail, actions)
- [x] Email Notifications (all major events)
- [x] Career Page (branding, benefits, jobs)
- [x] Company Settings (branding, configuration)
- [x] Dark Mode Support

### Partial Implementation
- [ ] Interview Scorecards (schema exists, UI missing)
- [ ] Fathom AI Integration (fields exist, not connected)
- [ ] Resume Auto-fill (parsing works, UI not connected)
- [ ] Advanced Analytics (basic charts only)

### Not Implemented
- [ ] Employee Management (onboarding, records)
- [ ] Video Interview Recording
- [ ] Offer Letter Templates
- [ ] Talent Pool / CRM
- [ ] External Integrations (LinkedIn, Slack)
- [ ] Multi-language Support

---

## Typical Hiring Workflow

1. **HR creates job** → AI generates JD → Saves with embedding
2. **Candidate applies** → Resume uploaded → Confirmation email
3. **HR analyzes resume** → AI matches to job → Score calculated
4. **Auto-advance to MCQ** (if score ≥ 60%) → Test invitation sent
5. **Candidate takes test** → Auto-graded → Score saved
6. **Auto-advance to interview** (if score ≥ 60%) → Interview invitation
7. **Candidate records interview** → Transcribed → Evaluated
8. **HR reviews** → Overall score calculated
9. **HR schedules live interview** → Google Meet created
10. **Interview conducted** → Decision made
11. **Offer extended** → Candidate hired

---

## File Structure

```
ai-hrms/
├── app/
│   ├── api/              # 27 API routes
│   ├── admin/            # 8 admin pages
│   ├── careers/          # 3 public career pages
│   ├── auth/             # Login page
│   ├── status/           # Application tracking
│   ├── test/             # MCQ test page
│   └── interview/        # Async interview page
├── components/           # 7 custom + 36 UI components
├── lib/                  # 10 utility files
├── migrations/           # 3 SQL migration files
└── package.json          # 52 dependencies
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

---

*Documentation generated for AI-HRMS v1.0*
