# Money Protocol V3

Scalable **Personal Finance OS** with strict layering and decision-first architecture.

## Refactored structure

- `lib/engine` → orchestration entry points for runtime, evaluation, monthly lifecycle, action generation, behavioral tracking, and multi-agent simulation.
- `lib/rules` → deterministic domain rules (allocation + expense intelligence).
- `lib/scoring` → financial score model.
- `lib/ai` → autonomous multi-agent pipeline (insight/decision/warning communication).
- `app/api` → thin API endpoints only.
- `app/components` → UI display-only components.

## Core APIs

- `POST /api/transactions` → ingest transaction, apply income allocation, run evaluation + autonomous AI cycle.
- `GET /api/actions` → fetch actionable commands for UI/mobile.
- `POST /api/engine/evaluate` → evaluate current financial state.
- `POST /api/cron/daily` → daily autonomous loop.

## Decision engine

`evaluateFinancialState(data)` returns:

- `blocked`
- `warnings`
- `suggestions`
- `score`
- `priorities` (`high` = block, `medium` = warning, `low` = suggestion)
- `escalations` (behavioral repeated-bad-habit escalation)

## Behavioral tracking + multi-agent simulation

- Tracks repeated patterns (food overuse, deficit risk) using memory counters.
- Escalates warnings when bad habits repeat over multiple cycles.
- Simulates three decision agents contributing to final priorities:
  - **Budget Guardian**
  - **Growth Advisor**
  - **Risk Controller**

## Allocation system

Income is split by configurable rule defaults:

- 50% essentials
- 25% investment
- 15% stability
- 10% joy

Recorded in `allocation_ledgers` for monthly budget intelligence and category limit warnings.

## Monthly system

- Generates historical records in `monthly_summaries`
- Preserves month history for reporting
- Supports automatic monthly lifecycle on each evaluation pass

## Run

1. Copy `.env.example` to `.env.local`.
2. Fill credentials.
3. `npm install`
4. `npm run dev`
