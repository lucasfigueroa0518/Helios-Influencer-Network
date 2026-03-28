# HIN — Helios Influencer Network

A full-stack SaaS platform for managing AI-powered Instagram influencer personas. Built with Next.js 16, Supabase, Google Gemini, and Tailwind CSS 4.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript 5.7+, Tailwind CSS 4, shadcn/ui |
| State | Zustand 5, TanStack Query v6 |
| Database | Supabase (PostgreSQL 16) with RLS |
| AI | Google Gemini 2.5 Flash |
| Queue | BullMQ 5 + Upstash Redis |
| Social | Instagram Graph API v21.0 |
| Auth | Supabase Auth (email/password, Google OAuth) |
| Monitoring | Sentry |

## Getting Started

### Prerequisites

- Node.js 22 LTS
- A Supabase project
- Instagram/Meta App credentials
- Google Gemini API key
- Upstash Redis instance

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your credentials
4. Run the database migrations in order against your Supabase project:
   ```
   supabase/001_schema.sql
   supabase/002_rls_policies.sql
   supabase/003_triggers_functions.sql
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, Signup pages
│   ├── (dashboard)/        # Protected app pages
│   │   ├── accounts/       # Account management + persona editor
│   │   ├── calendar/       # Content calendar (month/week views)
│   │   ├── posts/          # Post management + filtering
│   │   ├── inbox/          # Unified comment/DM inbox
│   │   ├── clients/        # Client project management
│   │   ├── analytics/      # Dashboard analytics
│   │   ├── team/           # Team collaboration
│   │   └── settings/       # User preferences
│   └── api/                # 30+ API route handlers
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Sidebar, TopBar, MobileNav
│   ├── upload/             # 4-step upload modal
│   └── shared/             # EmptyState, StatusBadge
├── lib/
│   ├── supabase/           # Client, server, middleware, types
│   ├── instagram/          # OAuth, publish, API wrapper
│   ├── gemini/             # AI client, prompts, parsers
│   ├── encryption.ts       # AES-256-GCM token encryption
│   ├── rate-limit.ts       # Upstash rate limiter configs
│   ├── queue.ts            # BullMQ queue/worker factory
│   └── validators/         # Zod schemas
├── stores/                 # Zustand stores
├── workers/                # 9 BullMQ worker definitions
├── hooks/                  # Custom React hooks
└── types/                  # Shared TypeScript types
```

## Key Features

- **Multi-Account Management**: Connect and manage N Instagram accounts with distinct AI personas
- **AI Caption Generation**: Gemini-powered captions respecting each account's voice and tone
- **4-Step Upload Modal**: Account selection → file upload → AI captions → scheduling
- **Content Calendar**: Month/week views with drag-to-reschedule
- **Smart Publishing**: Rate-limit-aware automated publishing with retry logic
- **Unified Inbox**: Comments + DMs with AI-drafted replies and priority scoring
- **Client Projects**: AI topic detection auto-suggests brand partnerships
- **Analytics Dashboard**: Engagement metrics, follower growth, hashtag ROI
- **Team Collaboration**: Role-based access (admin/manager/creator/viewer) with approval workflows

## Database

17 tables with full RLS policies. Run the SQL files in `supabase/` against your Supabase project dashboard (SQL Editor).

## Cron Jobs

Configured in `vercel.json` for Vercel deployment:

| Job | Schedule | Purpose |
|---|---|---|
| `publish` | Every 5 min | Publish scheduled posts |
| `sync-metrics` | Every 4 hours | Sync Instagram post metrics |
| `sync-comments` | Every 2 hours | Fetch new comments |
| `detect-topics` | Daily 3 AM UTC | AI topic detection for client suggestions |
| `maintenance` | Daily 4 AM UTC | Token refresh, cleanup, health checks |

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Set all environment variables from `.env.local` in your Vercel project settings.
