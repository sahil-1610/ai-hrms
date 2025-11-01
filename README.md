# AI-Powered HRMS MVP

A modern, AI-powered Human Resource Management System that automates recruitment, employee management, and performance tracking—making HR operations smarter, faster, and data-driven for growing companies.

**Prepared by:** Sahil Tiwari  
**Timeline:** 3 months (12 weeks)  
**Status:** In Development - Week 0 Setup Complete ✅

## 📋 Project Overview

This AI-HRMS system leverages cutting-edge AI technology to streamline the entire recruitment process:

- 🤖 **AI Resume Parsing** - Automatically extract structured data from resumes
- 🎯 **Smart Candidate Matching** - Semantic matching using OpenAI embeddings
- 📝 **Auto-generated Job Descriptions** - AI-powered JD generation
- ✅ **Automated Testing** - MCQ generation and auto-grading
- 🎙️ **Interview Evaluation** - Speech-to-text and AI assessment
- 📊 **Analytics Dashboard** - Comprehensive HR insights

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), TailwindCSS 4
- **Backend:** Next.js API Routes (Serverless)
- **Database:** Supabase (PostgreSQL with pgvector)
- **Authentication:** NextAuth.js
- **AI Layer:** OpenAI API (GPT-4o-mini, text-embedding-3-large, Whisper)
- **Storage:** Cloudinary
- **Email:** Nodemailer (Gmail/SMTP)
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- OpenAI API key
- Cloudinary account (optional)
- Gmail account or SMTP server (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-hrms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.template .env.local
   ```
   
   Fill in your credentials in `.env.local`:
   - Supabase URL and keys
   - NextAuth secret (generate with: `openssl rand -base64 32`)
   - OpenAI API key
   - Cloudinary credentials
   - Email credentials (see [Email Setup Guide](EMAIL_SETUP_GUIDE.md))

4. **Setup Supabase database**
   - Go to your Supabase project
   - Run the SQL in `supabase-schema.sql` in the SQL Editor
   - Enable pgvector extension for embeddings

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ai-hrms/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # NextAuth configuration
│   │   ├── jobs/              # Job management endpoints
│   │   └── applications/      # Application endpoints
│   ├── admin/                 # HR admin pages
│   │   ├── dashboard/         # Admin dashboard
│   │   └── jobs/              # Job management
│   ├── auth/                  # Authentication pages
│   ├── jobs/                  # Public job listings
│   ├── layout.js              # Root layout
│   └── page.js                # Homepage
├── components/                # Reusable components
├── lib/                       # Core libraries
│   ├── supabase.js           # Supabase client
│   ├── openai.js             # OpenAI utilities
│   └── utils.js              # Helper functions
├── utils/                     # Utility functions
│   ├── extractText.js        # PDF/DOCX parsing
│   └── scoring.js            # Scoring algorithms
├── supabase-schema.sql       # Database schema
└── .env.template             # Environment variables template
```

## 🎯 Implementation Roadmap

### ✅ Week 0: Setup & Preparation (COMPLETE)
- [x] GitHub repository created
- [x] Project structure setup
- [x] Core dependencies installed
- [x] Supabase schema created
- [x] Environment configuration
- [x] Utility functions (OpenAI, parsing, scoring)
- [x] Authentication setup (NextAuth)
- [x] UI components foundation

### 🔄 Month 1: Core Foundation (Weeks 1-4)
**Week 1: Authentication & Data Models**
- [ ] Complete authentication flow
- [ ] Role-based middleware
- [ ] Database models testing

**Week 2: Job Creation & AI JD Generator**
- [ ] Job creation form
- [ ] AI JD generation API
- [ ] Job listing page

**Week 3: Public Job Listing & Apply Flow**
- [ ] Public job browsing
- [ ] File upload system
- [ ] Application submission

**Week 4: Resume Parsing & Auto-fill**
- [ ] PDF/DOCX extraction
- [ ] AI resume parsing
- [ ] Auto-fill application form

### 📅 Month 2: AI Intelligence Layer (Weeks 5-8)
- Embeddings & Match Scoring
- HR Dashboard & Candidate Ranking
- MCQ Test Generation & Interface
- Auto-grading & Email Notifications

### 🎨 Month 3: Polish & Production (Weeks 9-12)
- Interview Recording & Transcription
- AI Transcript Evaluation
- UI/UX Polish & Error Handling
- Testing, Security & Deployment

## 🔑 Key Features

### For HR/Recruiters
- Create jobs with AI-generated descriptions
- View ranked candidates by match percentage
- Auto-graded technical assessments
- Interview transcript evaluation
- Comprehensive analytics dashboard

### For Candidates
- Browse active job openings
- Upload resume (PDF/DOCX)
- Auto-filled application forms
- Take technical assessments
- Track application status

## 📊 AI Features

### 1. Resume Parsing
Extract structured data from resumes:
- Name, email, phone
- Skills
- Education history
- Work experience

### 2. Semantic Matching
Use OpenAI embeddings to calculate similarity between:
- Job descriptions
- Candidate resumes
- Match score: 0-100%

### 3. Auto-generated Content
- Job descriptions based on role and requirements
- Technical MCQ questions
- Interview evaluation feedback

### 4. Scoring Algorithm
```
Overall Score = (0.5 × Resume Match) + (0.3 × Test Score) + (0.2 × Communication Score)
```

## 🔒 Security

- Row Level Security (RLS) in Supabase
- Role-based access control
- Secure API routes with NextAuth
- Environment variables for secrets
- File upload validation
- Rate limiting on AI endpoints

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run linting
npm run lint
```

## 📦 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

```bash
vercel --prod
```

## 📖 Documentation

- [Notion Documentation](https://www.notion.so/2b13199b0b014f14bf3acdb6148c5a0f)
- [Implementation Roadmap](https://www.notion.so/1198ba0ded6348668df63353ca747d08)
- [Technical Implementation](https://www.notion.so/21afc8acf51d4e95b8d67bc67cc33bd0)

## 🤝 Contributing

This is a MVP project. For contributions or suggestions, please open an issue or pull request.

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

**Sahil Tiwari**

## 🙏 Acknowledgments

- OpenAI for GPT and embeddings APIs
- Supabase for database and authentication
- Vercel for hosting and deployment
- Next.js team for the amazing framework

---

**Current Status:** Week 0 Setup Complete - Ready for Month 1 Implementation 🚀
