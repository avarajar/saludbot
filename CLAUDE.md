# SaludBot - WhatsApp Healthcare Chatbot for Colombian Clinics

## Overview
AI-powered WhatsApp chatbot that automates appointment scheduling, reminders, confirmations, and patient follow-up for medical practices in Colombia. Target: dental, veterinary, aesthetic, psychology, and specialist clinics.

## Tech Stack
- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude API via @anthropic-ai/sdk (claude-sonnet-4-20250514)
- **WhatsApp:** Twilio WhatsApp Business API
- **Calendar:** Google Calendar API (googleapis)
- **Language:** All patient-facing text is in Colombian Spanish ("usted" form)

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── webhooks/whatsapp/route.ts  # Twilio webhook (inbound messages)
│   │   ├── appointments/route.ts       # CRUD appointments
│   │   ├── patients/route.ts           # CRUD patients
│   │   ├── clinics/route.ts            # CRUD clinics
│   │   └── cron/reminders/route.ts     # Reminder cron endpoint
│   ├── dashboard/                      # Admin dashboard (React)
│   │   ├── layout.tsx                  # Sidebar + topbar
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── appointments/page.tsx       # Appointments list
│   │   └── patients/page.tsx           # Patients list
│   ├── layout.tsx                      # Root layout (Spanish)
│   └── page.tsx                        # Landing page
├── components/ui/                      # Reusable UI (Button, Card, StatusBadge)
├── lib/
│   ├── ai/
│   │   ├── classifier.ts              # Intent classification (Claude)
│   │   └── responder.ts               # Response generation (Claude)
│   ├── whatsapp/
│   │   ├── client.ts                   # Twilio client
│   │   └── handlers.ts                # Intent handlers (schedule, confirm, etc.)
│   ├── calendar/google.ts             # Google Calendar integration
│   ├── db/
│   │   ├── supabase.ts                # Supabase client setup
│   │   └── queries.ts                 # Database query functions
│   └── reminders/engine.ts           # Reminder engine (48h, 24h, 2h)
├── types/index.ts                     # TypeScript types
supabase/migrations/                   # SQL migrations
```

## Key Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check
```

## Environment Variables
See `.env.example` for all required variables:
- Supabase (URL, anon key, service role key)
- Twilio (account SID, auth token, WhatsApp number)
- Anthropic API key
- Google Calendar service account
- CRON_SECRET for reminder endpoint

## Architecture Flow
```
Patient (WhatsApp) → Twilio → /api/webhooks/whatsapp → Classify Intent (Claude)
  → Route to handler → Query DB / Calendar → Generate response (Claude)
  → Send reply via Twilio → Log conversation
```

## Intents
schedule, reschedule, cancel, confirm, info_services, info_hours, info_location, greeting, escalate, other

## Reminders
Cron hits GET /api/cron/reminders with Bearer token. Sends reminders at 48h, 24h, 2h before appointments via WhatsApp.

## Database
6 tables: clinics, patients, appointments, conversations, clinic_services, reminder_logs. All use UUID PKs. RLS enabled.

## Conventions
- All patient-facing text: Colombian Spanish, "usted" form
- Timezone: America/Bogota
- Currency: Colombian Pesos (COP)
- WhatsApp messages: max ~300 chars
- Error handling: never crash, always respond gracefully to patients
