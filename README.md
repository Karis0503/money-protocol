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

## Installation

Make sure Node.js and npm are installed on your machine.
1. Clone this repository.
2. Copy `.env.example` to `.env.local`.
3. Fill in the required Supabase credentials.
4. Install dependencies:
bash
npm install
6. Start the development server:
npm run dev

The app should now be available at http://localhost:3000.

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
