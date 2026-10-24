<div align="center">
  <a href="https://prepmasterlms.vercel.app/">
    <img src="frontend/public/brand/prepmaster-logo.png" alt="PrepMaster" width="260" />
  </a>

  <h1>PrepMaster LMS</h1>

  <p><strong>One home for smarter study, timed CBT practice, and SolidWorks learning.</strong></p>

  <p>
    <a href="https://prepmasterlms.vercel.app/"><strong>Explore the live app →</strong></a>
    &nbsp;·&nbsp;
    <a href="#-getting-started">Run it locally</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TanStack_Start-v1-ff4154?logo=reactrouter&logoColor=white" alt="TanStack Start" />
    <img src="https://img.shields.io/badge/Supabase-Postgres_%2B_Auth-3ecf8e?logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Payments-Paystack-00c3f7" alt="Paystack" />
  </p>
</div>

---

## Study with clarity. Build with confidence.

**PrepMaster** is an online learning platform built for Nigerian university students, with a focus on Science, Engineering, and Environmental Sciences/Architecture programmes.

Students can find course materials, take practice and scheduled live computer-based tests, track their attempts, and pay securely for premium resources. The same account can also unlock the **SolidWorks Design Lab** for guided CAD tasks, submissions, feedback, and a community showcase.

> **Live app:** [prepmasterlms.vercel.app](https://prepmasterlms.vercel.app/)

---

## 🎯 Key Features

### 🎓 Student Experience (`StudentShell`)
- **Authentication & Onboarding**: Email sign-up with email verification, Google OAuth, and tailored onboarding (Faculty → Department → Level; optional Matric number).
- **Home Dashboard**: Quick overview, continue-where-you-left-off resume cards, and featured courses/CBTs.
- **Drive (`/drive`)**: Hierarchical course file repository (`Course` → `Category` → `Subfolder` → `File`). Includes free and premium (Gold) materials with in-app preview for PDF, images, and video, plus Microsoft online viewer integration for Office documents.
- **Paystack Checkout**: Seamless payments for premium materials and courses. Secure server-side pricing in Kobo with automatic unlock upon callback verification.
- **My Library**: Aggregated view of all owned and purchased study materials.
- **CBT Examination Engine**: Practice and scheduled live exams.
  - Per-question auto-save on tap.
  - Server-authoritative timer with a 45-second network grace window.
  - Automatic submission when time expires.
  - Refresh-resilient attempt resumption.
- **My Attempts (`/attempts`)**: Detailed examination history with granular answer reviews (correct answers, chosen answers, skipped questions) with support for admin-toggled result concealment.
- **Account & Personalization**: Profile editing, transaction/payment history, and light/dark/system theme customization.

### 🛠️ SolidWorks Hub (`/solidworks/*` • `SwShell`)
- **Member Registration**: Dedicated flow for university students or external CAD enthusiasts.
- **Numbered CAD Tasks**: Sequenced challenges (#1, #2…) searchable by task number, complete with reference blueprints and images.
- **Submissions & Grading**: Project file submission with direct admin feedback and scoring.
- **Community & Showcase**: Public works gallery showcase, community Q&A forums, and premium tier features.

### 🛡️ Admin Management (`/admin/*` • `AdminShell`)
- **Analytics & Overview**: System metrics, active users, and revenue monitoring.
- **Course & Drive Management**: 3-step course creation wizard, folder structuring, and multi-file uploads with pricing controls.
- **CBT Creator & Control**: 3-step test creator, question bank manager, show/hide results toggles, and attempt analytics.
- **Student Moderation**: User directory, profile inspection, formal warnings, and account suspension workflows.
- **Financials**: Real-time Paystack transaction logs and payment tracking.
- **SolidWorks Admin**: Task assignment, CAD submission grading/reviews, and community moderation.

---

## 🏛️ System Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + **TanStack Start v1** (SSR, file-based routing, server functions) |
| **Styling & UI** | **Tailwind CSS v4**, shadcn/ui (Radix primitives), `lucide-react` |
| **State & Data Fetching**| TanStack Query v5, `react-hook-form`, `zod` |
| **Backend API** | **Hono** running on Node.js (`backend/`) |
| **Database & Auth** | **Supabase Postgres** (Row Level Security) + Supabase Auth (Email & Google OAuth) |
| **Object Storage** | **Cloudflare R2** (S3-compatible presigned uploads/downloads) |
| **Payments** | **Paystack** (Server-verified checkout & webhooks) |
| **AI Integration** | Lovable AI Gateway / `@ai-sdk/openai` (server-side evaluation) |

---

## 📂 Project Structure

```
prepmasterlms/
├── frontend/               # TanStack Start / Vite React application
│   ├── src/
│   │   ├── routes/         # File-based routes (Students, Admin, SolidWorks)
│   │   ├── components/     # UI components and shells (StudentShell, AdminShell, SwShell)
│   │   ├── lib/            # API client, Supabase config, utilities
│   │   └── styles.css      # Tailwind v4 theme configuration
│   └── package.json
├── backend/                # Hono API server
│   ├── src/
│   │   ├── routes/         # Expressive Hono route handlers
│   │   ├── middleware/     # Auth and validation middleware
│   │   └── services/       # Supabase, R2, and Paystack integration
│   ├── schema.sql          # Supabase Postgres schema & RLS rules
│   └── package.json
├── context/                # Product specifications & architectural context
├── docs/                   # Backend connection and deployment guides
├── SETUP.md                # Detailed local environment setup instructions
└── README.md
```

---

## 🚀 Getting Started

PrepMaster supports **Dummy Data Mode** out-of-the-box (no external credentials required to preview the UI). To connect real authentication, database, storage, and payments, refer to [SETUP.md](file:///C:/Users/HP/Desktop/CODE/2026_Projects/prepmasterlms/SETUP.md).

### Prerequisites
- Node.js (v18+ or v20+)
- npm or bun

### 1. Run the Backend API
```bash
cd backend
cp .env.example .env      # Configure Supabase, R2, and Paystack credentials
npm install
npm run dev               # API starts on http://localhost:4000
```

### 2. Run the Frontend App
```bash
cd frontend
cp .env.example .env      # Configure VITE_API_URL, VITE_SUPABASE_URL, etc.
npm install
npm run dev               # App runs on http://localhost:8080
```

> **Note**: When `VITE_API_URL` and Supabase keys are left empty, the frontend runs with mock services and demo role switchers. Once live keys are provided, it automatically switches to production services.

---

## 📜 Business Rules & Security

- **Tamper-proof Logic**: Prices, exam countdown timers, and quiz scoring are strictly authoritatively enforced on the server.
- **Currency**: Display prices in Naira (₦); monetary values are strictly processed and stored in **Kobo** on the backend.
- **Strict Role-based Access**: Handled via Supabase RLS and Hono JWT verification (`admin`, `student`, and `solidworks_member`).
- **Storage Protection**: Files in Cloudflare R2 are accessed strictly through signed, time-limited URLs.
# prepmasterlms
