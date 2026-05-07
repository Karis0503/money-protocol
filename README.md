# Money Protocol

Production-ready starter for a **Personal Finance Operating System** built with Next.js + Supabase.

## Architecture

- `app/api/chat`: chat endpoint for the UI.
- `app/api/transactions`: transaction ingestion + event-driven AI cycle trigger.
- `app/api/cron/daily`: autonomous daily automation loop trigger.
- `lib/ai/agents`: multi-agent communication broker + message types.
- `lib/ai/memory-system.ts`: long-term memory load/store.
- `lib/ai/prioritization.ts`: decision prioritization strategy.
- `lib/ai/daily-automation-loop.ts`: scheduled autonomous loop for all users.
- `supabase/schema.sql`: database schema.

## AI Operating Model

1. State Builder agent computes current financial state.
2. Analysis agent generates behavioral and predictive insights.
3. Decision agent generates and prioritizes enforceable commands.
4. Warning agent summarizes critical alerts.
5. Orchestrator stores outputs, logs inter-agent messages, and writes memory.

## Run

1. Copy `.env.example` to `.env.local`.
2. Fill credentials.
3. `npm install`
4. `npm run dev`

## Daily Automation

Schedule a POST request to `/api/cron/daily` and pass the `x-cron-secret` header to trigger the autonomous daily automation loop.
## Project Status

This project is currently under active development.

## Features

- Personal finance tracking
- AI-assisted financial analysis
- Decision prioritization system
- Daily automation workflow
- Supabase-backed data storage
  
## Roadmap

- Improve documentation
- Add screenshots
- Add setup instructions
- Prepare first public demo
