# DFT - Dgm Finance Tracker

DFT stands for **Dgm Finance Tracker**.

Tagline: **AI-powered personal finance dashboard.**

DFT is a premium dark fintech dashboard for personal finance tracking with Supabase Auth, Supabase Database/RLS, AI-assisted input, charts, goals, budgets, and print/PDF-ready reporting architecture.

## Current Build Status

Phase 1 through Phase 5 are implemented:

- Next.js + TypeScript + Tailwind CSS project structure
- Premium futuristic dark dashboard layout
- Login and register pages
- Protected app shell with desktop sidebar and mobile bottom navigation
- Supabase browser/server clients
- Middleware route protection
- Supabase SQL schema with RLS policies
- Default profile/accounts/categories setup route and page
- Server-side AI parse route with OpenAI support and bilingual rule-based fallback
- Dashboard with responsive cards and Recharts-based demo charts
- Report/PDF component shell and print CSS foundation
- Live accounts CRUD
- Live categories CRUD inside Settings
- Live transactions CRUD with date, type, category, and account filters
- Dashboard summary cards and charts calculated from Supabase finance data
- Budgets, goals, and report layouts with Recharts
- AI Assistant confirm/edit/cancel transaction save flow

Future phases will complete calendar depth, PDF export, and final responsive polish.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Database with Row Level Security
- Recharts
- Server-side AI API route architecture
- `@react-pdf/renderer` report shell

## Folder Structure

```txt
src/app
  (auth)                Login and register pages
  (app)                 Protected app routes
  api                   Server-side API routes
src/components
  ai                    AI chat and transaction preview components
  charts                Recharts dashboard/report charts
  dashboard             Dashboard cards and widgets
  forms                 Reusable finance forms
  layout                Sidebar, topbar, mobile nav, app shell
  page                  Shared page headers and feature shells
  reports               Printable and PDF report components
  setup                 Default data setup UI
  ui                    Shared UI primitives
src/lib
  ai                    Rule-based AI fallback parser
  config                Public/server environment config
  finance               Defaults, formatters, and demo data
  supabase              Supabase clients
supabase/schema.sql     Database tables, triggers, indexes, and RLS policies
```

## Environment Setup

Create `.env.local` from `.env.example`:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

OPENAI_API_KEY=your_private_ai_key
AI_PROVIDER=openai
AI_MODEL=gpt-4.1-mini
```

Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to the browser. Keep `OPENAI_API_KEY` server-side only.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. Copy the project URL and anon key into `.env.local`.
5. Restart the dev server.
6. Register a user in DFT.
7. Visit `/setup` if you need to manually create default accounts/categories.

The SQL file creates:

- `profiles`
- `accounts`
- `categories`
- `transactions`
- `budgets`
- `goals`
- `recurring_transactions`
- `ai_logs`

It also enables RLS and adds policies so each user only sees rows where `user_id = auth.uid()` or, for profiles, `id = auth.uid()`.

## Run Locally

```bash
npm install
npm run dev
```

On Windows PowerShell, if script execution blocks `npm`, use:

```bash
npm.cmd install
npm.cmd run dev
```

The `dev` and `build` scripts use a small wrapper that points Next.js to a local SWC WASM fallback. This helps on Windows machines where the native SWC binary is blocked or cannot load.

Then open:

```txt
http://localhost:3000
```

## AI Behavior

AI calls are designed to run through server-side routes only.

Current route:

```txt
POST /api/ai/parse
```

The implementation includes server-side OpenAI parsing when `OPENAI_API_KEY` is configured, plus a safe bilingual fallback parser for examples like:

- `I spent 35000 on lunch today`
- `Aku keluar 35 ribu buat makan siang hari ini`
- `Add expense 50rb buat GoFood tadi malam`
- `Tambah income 500k from jual parfum`

Parsed transactions are shown in a preview first. The user can Confirm, Edit, or Cancel, and transactions are only saved after Confirm.

## Phase Roadmap

Phase 4 and Phase 5:

- Budgets
- Goals
- Full dashboard chart coverage
- AI Assistant production transaction flow
- Confirm/edit/cancel save flow

Phase 6:

- Monthly and yearly reports
- PDF generation
- Print workflow

Phase 7:

- Final responsive polish
- Empty/loading/error states across live data pages
- Mobile UX refinements
