create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount bigint not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  source_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('habit', 'waste', 'prediction')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  severity text not null check (severity in ('low', 'medium', 'high')),
  command text not null,
  reason text not null,
  priority_rank int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  key text not null,
  value text not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table if not exists agent_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  from_agent text not null,
  to_agent text not null,
  topic text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists automation_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  finished_at timestamptz,
  users_processed int not null default 0,
  status text not null,
  summary jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_date on transactions (user_id, created_at desc);
create index if not exists idx_insights_user_date on insights (user_id, created_at desc);
create index if not exists idx_decisions_user_date on decisions (user_id, created_at desc);
create index if not exists idx_memory_user_date on memory (user_id, created_at desc);
create index if not exists idx_agent_messages_user_date on agent_messages (user_id, created_at desc);
