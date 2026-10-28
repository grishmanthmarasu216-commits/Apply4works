# Apply4Works

> **AI-Powered Career Copilot & Automated Job Search Acceleration Platform**

Apply4Works is an end-to-end career assistance platform engineered to streamline the modern job hunt. It bridges the gap between job discovery and application readiness by combining automated multi-source job scraping, custom-tailored job recommendation scoring, deep resume parsing, ATS (Applicant Tracking System) keyword analysis, hallucination-resistant resume bullet optimization, LinkedIn brand building, and application lifecycle tracking.

---

## 1. Project Overview

### Problem Statement
The modern job application workflow is notoriously manual, fragmented, and time-intensive:
- **Scattered Opportunities:** Job listings are spread across multiple platforms with duplicate postings and varying formats.
- **ATS Screening Hurdles:** Resumes submitted without job-specific keyword alignment frequently fail automated ATS parsers, regardless of candidate qualification.
- **Manual Tailoring Fatigue:** Tailoring resumes and cover letters for dozens of unique job descriptions takes hours per application.
- **Tracking Chaos:** Candidates struggle to monitor application statuses, deadlines, and follow-up schedules across spreadsheets or notes.

### Solution & Value Proposition
Apply4Works provides job seekers with an integrated career automation pipeline:
- **Centralized Job Feeds:** Automates continuous job ingestion via cloud scrapers (Apify), deduplicating listings across companies and sources.
- **Personalized Recommendations:** Scores and ranks jobs dynamically using a multi-factor matching engine based on title seniority, role taxonomies, skills, location, and posting recency.
- **Intelligent Resume Parsing:** Converts unstructured PDF/DOCX resumes into standardized, nested JSON schemas using Groq LLMs backed by regex validation for mission-critical contact data.
- **Fact-Locked AI Optimization:** Analyzes job descriptions for missing ATS keywords and rewrites resume bullet points using target terminology while strictly validating and preserving verifiable historical facts (dates, organizations, metric numbers) to eliminate AI hallucinations.
- **Career Growth Hub:** Provides cover letter generation, AI LinkedIn post creation, interview knowledge chat, and a full application tracking board.

---

## 2. Key Features

- **Automated Job Ingestion & Deduplication:**
  - Background schedulers (`node-cron`) trigger Apify actors to pull job openings from platforms like LinkedIn.
  - Normalizes job attributes and runs multi-stage deduplication using URL tracking, signature hashes (`title-company-location`), and MongoDB compound unique indexes.
- **Personalized Match Scoring Engine:**
  - Evaluates jobs against user onboarding preferences (desired roles, locations, skills, experience level, remote preferences).
  - Employs a multi-tier scoring algorithm that awards base points for exact/synonym title matches, adds skill overlap points, and applies recency bonuses.
  - Features in-memory caching (`GLOBAL_JOBS_CACHE` and MD5-hashed query caches) for ultra-fast filtering and pagination.
- **AI-Powered Resume Parser (V2 Unified Schema):**
  - Accepts PDF, DOC, and DOCX uploads up to 10MB via Multer.
  - Extracts raw text using `pdf-parse` and `mammoth`.
  - Runs hybrid extraction: regex safeguards contact details (email, phone, URLs), while Groq LLM parses nested career histories, education, projects, skills, and certifications into a unified schema.
- **ATS Analysis & Match Breakdown:**
  - Compares structured resume content against target job descriptions.
  - Computes an overall ATS score and categorizes keywords into matched skills, missing competencies, and high-priority terms.
- **Hallucination-Resistant Resume Optimizer:**
  - Rewrites experience bullet points to integrate missing job keywords.
  - Implements a proprietary **Fact Lock** mechanism (`validateFacts`): extracts factual anchors (organizations, dates, metric figures) prior to AI generation and automatically strips or reverts unauthorized metrics invented by the LLM.
- **Interactive Resume Builder & Multi-Format Export:**
  - Full-featured browser editor with section-by-section editing, autosave, version snapshots, and rollback support.
  - Direct client-side export to PDF (`html2pdf.js`) and DOCX (`docx`).
- **Application Tracking System (ATS):**
  - Manage job opportunities across customizable lifecycle stages (`Saved`, `Liked`, `Applied`, `Interviewing`, `Offered`, `Rejected`).
  - Dedicated follow-up tracking and application history logging.
- **LinkedIn Growth Suite:**
  - Generates viral and professional LinkedIn posts from custom topics or direct resume achievements.
  - Supports post drafting, scheduling, image attachments, and LinkedIn OAuth integration.
- **Knowledge Base & Career Assistant:**
  - AI chat interface powered by Groq and Tavily search integration for domain-specific interview prep, roadmaps, and topic exploration.
  - Bookmark and search history management.
- **Secure Authentication & OTP Verification:**
  - Dual authentication: Email/Password (hashed via `bcrypt`) with 6-digit email OTP verification, alongside one-tap Google OAuth 2.0.
  - Stateless JSON Web Token (JWT) session authorization on protected API routes.
- **Monetization & Subscription Management:**
  - Tiered membership plans (`Free`, `Basic`, `Pro`, `Pro Plus`).
  - Integrated with Razorpay checkout featuring coupon code validation, automated zero-rupee discount bypass, and server-side HMAC SHA256 signature verification.
- **Automated Email Schedulers:**
  - Daily cron workflows checking subscription expiry windows, sending renewal reminders, and notifying free users of feature benefits via Resend / Nodemailer with deduplication logs.

---

## 3. Tech Stack

| Layer | Technology | Version / Spec | Why It Is Used | Where It Is Used |
|---|---|---|---|---|
| **Frontend Framework** | React | `19.2.5` | Component-based reactive UI architecture | `app/src/` |
| **Build Tool** | Vite | `8.0.9` | High-speed ESM bundling and Hot Module Replacement | `app/vite.config.js` |
| **Routing** | React Router DOM | `7.14.2` | Declarative client-side routing and protected route guards | `app/src/App.jsx` |
| **Styling** | Tailwind CSS | `3.4.19` | Utility-first responsive styling and typography | `app/src/index.css`, `tailwind.config.js` |
| **UI Components & Icons**| Lucide React | `1.22.0` | Accessible modern icon system | Throughout frontend views |
| **Animations** | Framer Motion | `12.40.0` | Smooth UI transitions, modals, and card animations | `app/src/pages/`, `app/src/components/` |
| **Document Export** | `docx`, `html2pdf.js` | `9.7.1`, `0.14.0` | Dynamic client-side Word (.docx) and PDF generation | `app/src/utils/exportUtils.js` |
| **OAuth Client** | `@react-oauth/google` | `0.13.5` | Google Identity Services authentication on the client | `app/src/pages/Login.jsx` |
| **SEO Management** | `react-helmet-async` | `3.0.0` | Dynamic document meta headers for public SEO pages | `app/src/pages/seo/` |
| **Backend Runtime** | Node.js | `>= 18.x` | Asynchronous, event-driven JavaScript server environment | `backend/` |
| **Web Framework** | Express.js | `4.21.2` | RESTful routing, middleware composition, static serving | `backend/index.js` |
| **Database** | MongoDB & Mongoose | `8.9.5` | Flexible document store ideal for polymorphic resume schemas | `backend/models/`, `backend/config/db.js` |
| **Authentication** | `jsonwebtoken`, `bcrypt` | `9.0.3`, `6.0.0` | Stateless token verification and salted password hashing | `backend/controllers/authController.js` |
| **Google Auth (Backend)**| `google-auth-library` | `10.7.0` | Server-side verification of Google Identity ID tokens | `backend/controllers/authController.js` |
| **AI Inference** | Groq SDK | `1.3.0` | Ultra-low-latency LLaMA inference for JSON parsing & generation | `backend/services/aiService.js` |
| **AI Fallback** | `@google/genai` | `2.9.0` | Google Gemini API integration for secondary text processing | `backend/services/` |
| **Web Scraping** | Apify Client | `2.23.3` | Cloud-based headless scrapers for job listings | `backend/services/apifyService.js` |
| **Payment Gateway** | Razorpay Node SDK | `2.9.6` | Order generation and webhook payment verification | `backend/controllers/paymentController.js` |
| **Task Scheduling** | `node-cron` | `3.0.3` | Scheduled background execution for job syncing and emails | `backend/scheduler/`, `backend/index.js` |
| **Email Delivery** | Resend & Nodemailer | `6.12.4`, `8.0.10` | Transactional OTPs and cron-based notification emails | `backend/services/emailService.js` |
| **File Parsing** | `pdf-parse`, `mammoth` | `1.1.4`, `1.12.0` | Binary document text extraction from PDFs and Word files | `backend/services/resumeParser.js` |
| **File Upload Handling** | Multer | `2.2.0` | Disk storage middleware with file size and type validation | `backend/routes/resumeRoutes.js` |

---

## 4. Project Architecture

The system follows a modern decoupled **Client-Server Architecture**:

```text
                             ┌───────────────────────────────┐
                             │       User Web Browser        │
                             └──────────────┬────────────────┘
                                            │
                                            ▼
                             ┌───────────────────────────────┐
                             │      React 19 Frontend        │
                             │  (Vite, Tailwind, Context API)│
                             └──────────────┬────────────────┘
                                            │
                                            │ HTTPS / REST (JSON + JWT)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Express.js Backend API                                   │
│                                                                                        │
│   ┌───────────────────────┐   ┌──────────────────────────┐   ┌─────────────────────┐   │
│   │    API Middlewares    │   │       Controllers        │   │    Service Layer    │   │
│   │ (CORS, Auth, Multer)  ├──►│  (Auth, Jobs, Resume,    ├──►│  (AI, Apify, Email, │   │
│   └───────────────────────┘   │   Payments, LinkedIn)    │   │   Matching, ATS)    │   │
│                               └────────────┬─────────────┘   └──────────┬──────────┘   │
│                                            │                            │              │
│   ┌────────────────────────────────────────┴────────────────────────────┴──────────┐   │
│   │           Schedulers: node-cron (Job Sync, Email Reminders, LinkedIn)         │   │
│   └───────────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────┬──────────────────────┬────────────────────────┬────────────────┘
                        │                      │                        │
                        ▼                      ▼                        ▼
           ┌──────────────────────┐ ┌────────────────────┐ ┌───────────────────────────┐
           │   MongoDB Database   │ │ External AI APIs   │ │  External Cloud Services  │
           │ (Users, Resumes,     │ │ (Groq LLaMA,       │ │ (Apify Scrapers,          │
           │  Jobs, Applications) │ │  Google Gemini)    │ │  Razorpay, Resend Email)  │
           └──────────────────────┘ └────────────────────┘ └───────────────────────────┘
```

### Architectural Breakdown
1. **Frontend Client:** Single Page Application (SPA) providing protected routing guards (`AppRoute`, `PricingRoute`, `GuestRoute`) and centralized global state management using React Context (`AuthContext`, `AppContext`).
2. **Backend API Gateway:** Express server providing endpoint routing, static upload serving, CORS filtering, and a global error handler preventing uncaught process termination.
3. **Service Layer:** Decouples core business logic from transport controllers. Coordinates AI prompt generation, Apify task triggers, ATS algorithms, and transactional emails.
4. **Caching Subsystem:** Node.js memory caches store active job pools (`GLOBAL_JOBS_CACHE`) and hashed recommendation queries to minimize MongoDB read load.
5. **Background Workers:** In-process `node-cron` workers operate independently of HTTP request lifecycles to sync jobs every 6 hours and process email queues daily.

---

## 5. Complete System Flow

A representative request-to-response lifecycle through Apply4Works:

```text
1. User Action:
   User clicks "Optimize Resume for Job" on the frontend.
      │
      ▼
2. Client Dispatch:
   React executes fetch() to POST /api/resume/optimize with target Job ID and JWT header.
      │
      ▼
3. Security & Validation Middleware:
   Express inspects JWT token via authMiddleware.js -> Populates req.user.
      │
      ▼
4. Controller Routing:
   resumeController.optimizeResume extracts target Job and user's Resume document.
      │
      ▼
5. Service Execution (Fact Locking & AI Prompting):
   resumeAiEnhancer.js extracts "Locked Facts" (dates, metrics, company names).
   Dispatches prompt to Groq API (LLaMA) requesting bullet rewrites using missing ATS keywords.
      │
      ▼
6. AI Inference & Validation:
   Groq returns structured JSON.
   validateFacts() audits response: discards hallucinated metrics and restores original dates.
      │
      ▼
7. Database Persistence:
   Mongoose appends result to resume.optimizationHistory and updates current resumeData.
      │
      ▼
8. Client Response & Re-Render:
   JSON response returned with updated score and bullet points -> React updates state -> UI updates.
```

---

## 6. Project Folder Structure

```text
Apply4Works/
├── app/                              # Frontend React SPA
│   ├── public/                       # Static public assets, icons, manifest
│   ├── src/
│   │   ├── assets/                   # Images, illustrations, branding graphics
│   │   ├── components/               # Modular reusable UI components
│   │   │   ├── resume/               # Resume builders, preview cards, templates
│   │   │   ├── linkedin-growth/      # LinkedIn generation controls, schedule views
│   │   │   ├── Blog/                 # Blog post cards, search, listings
│   │   │   ├── Navbar.jsx            # Application navigation header
│   │   │   ├── JobCard.jsx           # Individual job card with match badge
│   │   │   ├── ProGate.jsx           # Feature-locking modal for non-paying users
│   │   │   └── ErrorBoundary.jsx     # Global UI fallback boundary
│   │   ├── config/                   # API endpoint constants and branding settings
│   │   ├── context/                  # React Context providers (AuthContext, AppContext)
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── pages/                    # Route-level view components
│   │   │   ├── Dashboard.jsx         # User central hub with analytics & quick actions
│   │   │   ├── DailyJobs.jsx         # Recommended and searchable job listing feed
│   │   │   ├── JobDetail.jsx         # In-depth job breakdown & ATS match details
│   │   │   ├── JobResumeOptimizer.jsx# Side-by-side job ATS optimization workspace
│   │   │   ├── ResumeBuilderV2.jsx   # Full interactive resume editor and exporter
│   │   │   ├── Applications.jsx      # Job application tracker (Kanban/List view)
│   │   │   ├── LinkedInGrowth.jsx    # Post generator, scheduler, and draft editor
│   │   │   ├── Knowledge.jsx         # AI career advisor and interview prep chat
│   │   │   ├── Pricing.jsx           # Plan selection and Razorpay checkout
│   │   │   ├── OnboardingPage.jsx    # User role, skill, and location preference setup
│   │   │   ├── Login.jsx / Register.jsx # Authentication forms with OTP verification
│   │   │   └── seo/                  # Public SEO-indexed landing pages & blogs
│   │   ├── utils/                    # Client-side ATS scoring, normalizers, docx export
│   │   ├── App.jsx                   # Primary router setup and route guards
│   │   ├── index.css                 # Tailwind CSS styles and custom utilities
│   │   └── main.jsx                  # React DOM entry point
│   ├── .env                          # Frontend environment variables
│   ├── .gitignore                    # Frontend git exclusion rules
│   ├── package.json                  # Frontend dependencies and Vite scripts
│   ├── tailwind.config.js            # Tailwind theme, typography, color extensions
│   └── vite.config.js                # Vite build and plugin configurations
│
└── backend/                          # Backend Express REST API
    ├── config/                       # Database connector (Mongoose / MongoDB)
    ├── controllers/                  # Route request handlers
    │   ├── authController.js         # Register, Login, Google Auth, OTP verification
    │   ├── jobsController.js         # Job search, matching engine, in-memory cache
    │   ├── resumeController.js       # Resume upload, parsing, ATS analysis, optimization
    │   ├── paymentController.js      # Razorpay order creation, coupon & signature checks
    │   ├── linkedin.controller.js    # Post generation, draft management, scheduling
    │   ├── applicationController.js  # Application status tracker & follow-up endpoints
    │   └── knowledgeController.js    # Career chat assistant & bookmark persistence
    ├── middleware/                   # Authentication & request validation middleware
    │   └── authMiddleware.js         # JWT extraction, token verification, route protection
    ├── models/                       # Mongoose database schemas
    │   ├── User.js                   # User accounts, auth provider, subscription state
    │   ├── Job.js                    # Job listings, skills, indexes for deduplication
    │   ├── Resume.js                 # V2 unified resume schema, optimization & versions
    │   ├── Preference.js             # User job preferences (roles, skills, locations)
    │   ├── Application.js            # User job applications and workflow stages
    │   ├── SavedJob.js / LikedJob.js # Saved and bookmarked job references
    │   ├── Subscription.js           # Active plans, payment history, renewal dates
    │   └── EmailLog.js               # Audit log to prevent duplicate automated emails
    ├── routes/                       # Express route definitions mapping to controllers
    ├── scheduler/                    # node-cron task workers
    │   ├── emailCron.js              # Daily plan expiry and renewal notification jobs
    │   └── linkedinCron.js           # Scheduled post publishing jobs
    ├── services/                     # Business logic and external service integrations
    │   ├── aiService.js              # Centralized Groq LLM client with retry mechanics
    │   ├── apifyService.js           # Apify cloud scraper orchestration & normalization
    │   ├── jobFetcher.js             # Job ingestion coordinator and bulk database writes
    │   ├── resumeParser.js           # Multi-step resume text parsing and schema generation
    │   ├── resumeAiEnhancer.js       # Fact-locked bullet optimization & cover letter generation
    │   └── emailService.js           # Transporter logic for Resend and Nodemailer
    ├── uploads/                      # Local storage directory for uploaded resumes & images
    ├── .env                          # Backend environment variables
    ├── .gitignore                    # Backend git exclusion rules
    ├── index.js                      # Main Express server entry point and cron bootstrap
    └── package.json                  # Backend dependencies and startup scripts
```

---

## 7. Prerequisites

Before installing and running the project locally, ensure you have:
- **Node.js:** `v18.x` or `v20.x` (LTS recommended)
- **Package Manager:** `npm` (v9.x or v10.x) or `yarn` / `pnpm`
- **Database:** A running instance of **MongoDB** (local `mongodb://localhost:27017` or a free MongoDB Atlas cloud cluster URI)
- **External API Keys (for full feature enablement):**
  - Groq API Key (for high-speed resume parsing, ATS optimization, and AI chat)
  - Razorpay Key ID & Key Secret (for payment simulation or testing)
  - Apify API Token & Actor Task IDs (for live LinkedIn job scraping)
  - Google OAuth Client ID & Secret (for Google One-Tap sign in)
  - Resend API Key (for email OTP delivery and automated notices)

---

## 8. Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/Apply4Works.git
cd Apply4Works
```

### 2. Backend Setup
Navigate into the `backend` folder and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see [Environment Variables](#9-environment-variables)).

### 3. Frontend Setup
Open a new terminal window, navigate into the `app` folder, and install dependencies:
```bash
cd app
npm install
```

Create a `.env` file in the `app/` directory (see [Environment Variables](#9-environment-variables)).

---

## 9. Environment Variables

> **Security Note:** Never commit actual `.env` files or API credentials to version control. Use `.env.example` templates in your repository.

### Backend (`backend/.env`)

| Variable Name | Required | Default / Example | Purpose |
|---|---|---|---|
| `PORT` | No | `3000` | Port on which the Express server listens |
| `MONGODB_URI` | **Yes** | `mongodb://localhost:27017/apply4works` | MongoDB connection connection string |
| `JWT_SECRET` | **Yes** | *Secret string* | Secret key for signing and verifying JWTs |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin for local development |
| `GROQ_API_KEY` | **Yes** | `gsk_...` | Groq API key for LLaMA inference |
| `APIFY_TOKEN` | Optional | `apify_api_...` | Apify API token for running web scrapers |
| `LINKEDIN_TASK_ID` | Optional | *Apify Actor Task ID* | Task ID for scraping LinkedIn job postings |
| `JOB_FETCH_INTERVAL_HOURS` | No | `6` | Frequency (in hours) for automated job sync |
| `RAZORPAY_KEY_ID` | Optional | `rzp_test_...` | Razorpay public key ID for checkout |
| `RAZORPAY_KEY_SECRET` | Optional | *Razorpay Secret* | Secret key for HMAC payment signature checks |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | *Webhook Secret* | Secret key for verifying inbound webhooks |
| `GOOGLE_CLIENT_ID` | Optional | *OAuth Client ID* | Google OAuth Client ID for identity verification |
| `GOOGLE_CLIENT_SECRET` | Optional | *OAuth Secret* | Google OAuth Client Secret |
| `RESEND_API_KEY` | Optional | `re_...` | Resend API key for transactional emails |
| `EMAIL_FROM` | No | `onboarding@resend.dev` | Verified sender address for system emails |
| `LINKEDIN_CLIENT_ID` | Optional | *LinkedIn App Client ID* | LinkedIn OAuth Client ID for social growth |
| `LINKEDIN_CLIENT_SECRET` | Optional | *LinkedIn App Secret* | LinkedIn OAuth App Secret |
| `LINKEDIN_REDIRECT_URI` | Optional | `http://localhost:3000/api/linkedin/callback` | OAuth redirect callback URL |

### Frontend (`app/.env`)

| Variable Name | Required | Default / Example | Purpose |
|---|---|---|---|
| `VITE_API_URL` | **Yes** | `http://localhost:3000` | Target URL of the backend API server |
| `VITE_GOOGLE_CLIENT_ID` | Optional | *OAuth Client ID* | Google OAuth Client ID for login button |
| `VITE_RAZORPAY_KEY_ID` | Optional | `rzp_test_...` | Razorpay public key initialized in the browser |

---

## 10. How to Run the Project

### Starting the Backend Server
From the `backend/` directory:
```bash
cd backend
npm start
```
The server will connect to MongoDB, verify LinkedIn/OAuth configs, initialize the in-memory jobs cache, run an initial job sync, and start listening on port `3000` (or `PORT`).

### Starting the Frontend Client
From the `app/` directory:
```bash
cd app
npm run dev
```
Vite will launch the local development server at `http://localhost:5173`. Open this URL in your browser to access Apply4Works.

### Building for Production
To generate an optimized static production build for the frontend:
```bash
cd app
npm run build
```
Production assets are generated in `app/dist`.

---

## 11. Application Workflow

```text
       [ Public User ]
              │
              ├──► Browses SEO Landing Pages, Blog, & Keyword Guides
              │
              ▼
   [ Register / Login ] ──► Verifies 6-digit Email OTP or logs in via Google
              │
              ▼
   [ Onboarding Setup ] ──► Selects Desired Roles, Preferred Locations, & Core Skills
              │
              ▼
   [ Personalized Jobs ] ──► System runs In-Memory Match Scoring against scraped jobs
              │
              ├──► Saves or Likes jobs for later
              └──► Selects a Job to inspect full requirements
                     │
                     ▼
         [ Resume Optimization ]
                     │
                     ├──► Uploads PDF / DOCX or uses Built-in Resume
                     ├──► System computes ATS score & identifies missing keywords
                     └──► Fact-Locked AI rewrites bullet points to include terms
                            │
                            ▼
         [ Application Tracking ] ◄── Moves job to "Applied", schedules follow-up
```

---

## 12. API Documentation

All protected routes require an `Authorization: Bearer <JWT>` header.

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create new account; sends 6-digit verification OTP |
| `POST` | `/api/auth/verify-otp` | Public | Verifies OTP code; returns authenticated user and JWT |
| `POST` | `/api/auth/login` | Public | Validates credentials; triggers OTP step |
| `POST` | `/api/auth/google` | Public | Authenticates Google OAuth ID token; returns JWT |
| `GET` | `/api/auth/me` | Protected | Returns authenticated user profile and preferences |
| `POST` | `/api/auth/logout` | Public | Clears client session context |

### Jobs & Applications (`/api`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/jobs` | Optional Auth | Retrieves paginated jobs sorted by match score or date |
| `GET` | `/api/jobs/search` | Optional Auth | Queries jobs by keyword, location, remote, or company |
| `GET` | `/api/jobs/:id` | Optional Auth | Retrieves detailed job description, responsibilities, & skills |
| `GET` | `/api/dashboard/stats` | Protected | Aggregates application counts, match trends, & activity |
| `GET` | `/api/jobs/saved` | Protected | Retrieves user's saved job collection |
| `POST` | `/api/jobs/save` | Protected | Saves a job to user's saved list |
| `DELETE`| `/api/jobs/save/:jobId` | Protected | Removes a job from saved collection |
| `GET` | `/api/applications` | Protected | Lists all active job applications and statuses |
| `POST` | `/api/applications` | Protected | Creates a new application tracking entry |
| `PATCH` | `/api/applications/:id/status` | Protected | Updates application stage (`Applied`, `Interview`, etc.) |
| `GET` | `/api/applications/followups` | Protected | Returns applications with upcoming follow-up dates |

### Resume Management (`/api/resume`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/resume/upload` | Protected | Uploads PDF/DOCX (Multer); extracts text and parses to JSON |
| `GET` | `/api/resume/me` | Protected | Returns user's active resume and version history |
| `PUT` | `/api/resume/save` | Protected | Autosaves modifications to V2 unified resume schema |
| `POST` | `/api/resume/analyze-job` | Protected | Calculates ATS score & missing keywords for a target job |
| `POST` | `/api/resume/optimize` | Protected | Runs fact-locked AI rewriting of resume bullets for a job |
| `POST` | `/api/resume/generate-cover-letter` | Protected | Generates tailored 300-word cover letter for a job |
| `GET` | `/api/resume/versions` | Protected | Lists stored historical versions of user's resume |
| `POST` | `/api/resume/restore-version` | Protected | Reverts resume to a selected historical version snapshot |

### Payments & Webhooks (`/api/payment` & `/api/webhooks`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/payment/create-order` | Protected | Creates a Razorpay order or grants instant free coupon bypass |
| `POST` | `/api/payment/verify-payment` | Protected | Validates Razorpay HMAC signature & upgrades subscription |
| `POST` | `/api/payment/validate-coupon` | Protected | Checks coupon validity, percentage off, or 100% discount |
| `POST` | `/api/webhooks/razorpay` | Public | Ingests automated Razorpay billing and subscription events |

### LinkedIn Growth & Knowledge (`/api/linkedin` & `/api/knowledge`)
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/linkedin/generate` | Protected | Generates structured LinkedIn posts from custom topics |
| `POST` | `/api/linkedin/generate-from-resume` | Protected | Generates thought leadership posts from resume achievements |
| `GET` | `/api/linkedin/drafts` | Protected | Lists stored LinkedIn drafts |
| `POST` | `/api/linkedin/schedule` | Protected | Schedules a drafted post for publishing |
| `GET` | `/api/knowledge/latest` | Protected | Generates roadmaps, trends, and interview prep guides |
| `POST` | `/api/knowledge/bookmark` | Protected | Toggles saved bookmark on career insights |

---

## 13. Database Design

Apply4Works uses MongoDB with Mongoose schemas designed for rapid reads, structured versioning, and strict deduplication.

```text
       ┌───────────────┐                  ┌──────────────────┐
       │     User      │ 1 ──────────── 1 │    Preference    │
       │  (auth/plan)  │                  │  (roles/skills)  │
       └───────┬───────┘                  └──────────────────┘
               │
               │ 1
               │
               ▼ 1
       ┌───────────────┐                  ┌──────────────────┐
       │    Resume     │ 1 ──────────── M │   Application    │
       │ (unified V2)  │                  │ (status/history) │
       └───────────────┘                  └────────┬─────────┘
                                                   │
                                                   │ M
                                                   ▼ 1
                                          ┌──────────────────┐
                                          │       Job        │
                                          │(scraped listings)│
                                          └──────────────────┘
```

### Core Collections

#### 1. `users`
- **Purpose:** Manages user authentication, profile details, subscription level, and onboarding status.
- **Key Fields:** `email` (unique), `password` (hashed), `provider` (`local` | `google`), `plan` (`Free`, `Basic`, `Pro`, `Pro Plus`), `onboardingCompleted` (Boolean), `pricingCompleted` (Boolean), `verification` (hashed OTP & expiry).

#### 2. `jobs`
- **Purpose:** Stores aggregated and scraped job postings.
- **Key Fields:** `title`, `company`, `location`, `job_type`, `skills_required` (Array), `description`, `apply_link`, `created_at`.
- **Compound Indexes:**
  - `{ title: 1, company: 1 }` (unique): Prevents duplicate postings of the same role from the same employer.
  - `{ apply_link: 1 }` (unique, sparse): Guarantees canonical application URL uniqueness.
  - Performance indexes on `created_at: -1`, `location: 1`, `skills_required: 1`.

#### 3. `resumes`
- **Purpose:** Unified single source of truth for candidate resume data, versions, and ATS history.
- **Key Fields:**
  - `user`: Reference to `User` (unique).
  - `resumeData`: Nested schema storing `personalInfo`, `experience`, `education`, `projects`, `skills` (categorized by programming, frameworks, cloud, devops, tools), and `certifications`.
  - `versionHistory`: Array of dated resume snapshots with ATS scores and labels for one-click rollback.
  - `optimizationHistory`: Audit trail of optimized sections, target job titles, and score progression.

#### 4. `applications`
- **Purpose:** Tracks applicant progress for specific jobs.
- **Key Fields:** `userId`, `jobId`, `status` (`Applied`, `Interviewing`, `Offered`, `Rejected`), `appliedDate`, `followUpDate`, `notes`.

#### 5. `preferences`
- **Purpose:** Stores user-configured onboarding criteria used by the matching engine.
- **Key Fields:** `desiredRoles` (Array), `locations` (Array), `experienceLevel`, `jobType`, `skills` (Array).

---

## 14. Screenshots

> *Placeholder: Add application screenshots here to showcase the user interface in your repository.*

| Dashboard & Recommended Jobs | Fact-Locked Resume Optimizer |
|:---:|:---:|
| *(Add screenshot: Dashboard view)* | *(Add screenshot: Resume Optimizer view)* |

| Resume Builder & Live Preview | Application Tracker |
|:---:|:---:|
| *(Add screenshot: Resume Builder)* | *(Add screenshot: Applications board)* |

---

## 15. Testing

- **Backend:** Automated unit/integration test suites are not currently implemented. `backend/package.json` contains the standard placeholder test script (`echo "Error: no test specified"`).
- **Frontend:** Code quality and syntax validation are supported via ESLint:
  ```bash
  cd app
  npm run lint
  ```
- **Manual Verification:** All endpoints can be exercised via Postman or browser developer tools by executing the flows outlined in [Complete System Flow](#5-complete-system-flow).

---

## 16. Deployment

### Recommended Deployment Model
- **Frontend Client:** Deployed as a static SPA on platforms such as **Vercel**, **Netlify**, or **Cloudflare Pages**.
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment Variables: `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_RAZORPAY_KEY_ID`
- **Backend API:** Deployed on standard Node.js hosting environments such as **Render**, **Railway**, **Heroku**, or an **AWS EC2 / DigitalOcean** instance.
  - Start Command: `node index.js`
  - Port Configuration: Set via `PORT` environment variable.
- **Database:** Hosted on **MongoDB Atlas** with a dedicated replica set and IP access whitelist.
- **CORS Notice:** When hosting production builds, verify that your production frontend domains are explicitly included in `allowedOrigins` within `backend/index.js`.

---

## 17. Future Improvements

- **Database-Driven Recommendations:** Transition the in-memory `GLOBAL_JOBS_CACHE` to MongoDB Atlas Search / Vector Search or Elasticsearch to support millions of job records without server memory saturation.
- **Message Queues:** Offload Apify scraping coordination and email dispatching to a distributed Redis-backed queue (such as BullMQ) for improved fault isolation.
- **API Rate Limiting:** Introduce `express-rate-limit` on public authentication and AI generation routes to protect against abuse and token exhaustion.
- **Automated Test Coverage:** Implement comprehensive unit and integration testing using Vitest for React and Jest / Supertest for Express controllers.
- **Direct ATS Integrations:** Support automated application submission via Greenhouse, Lever, and Workday partner APIs.

---

## 18. Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a dedicated feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "Add feature: your feature description"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request detailing the changes introduced.

---

## 19. License

This project does not currently have a dedicated top-level open-source license file. A formal license (such as MIT or proprietary) should be selected and added prior to commercial distribution. (Note: `backend/package.json` specifies ISC as a placeholder).

---

## 20. Author

**Apply4Works Developer**
- **GitHub:** [Your GitHub Profile](https://github.com/)
- **LinkedIn:** [Your LinkedIn Profile](https://linkedin.com/in/)
- **Email:** `your-email@example.com`

---

*Built with passion to empower job seekers through intelligent automation.*
