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

create table if not exists allocation_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  bucket text not null check (bucket in ('essentials', 'investment', 'stability', 'joy')),
  ratio numeric(4,3) not null,
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, bucket)
);

create table if not exists allocation_ledgers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  month_key text not null,
  bucket text not null check (bucket in ('essentials', 'investment', 'stability', 'joy')),
  amount bigint not null,
  ratio numeric(4,3) not null,
  created_at timestamptz not null default now()
);

create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in ('habit', 'waste', 'prediction')),
  content text not null,
  confidence numeric(4,3) not null default 0.5,
  agent text not null,
  created_at timestamptz not null default now()
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  severity text not null check (severity in ('low', 'medium', 'high')),
  command text not null,
  reason text not null,
  priority_score int not null default 0,
  agent text not null,
  created_at timestamptz not null default now()
);

create table if not exists actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  action_type text not null check (action_type in ('critical', 'primary', 'secondary')),
  command text not null,
  status text not null check (status in ('pending', 'done', 'dismissed')) default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  memory_type text not null check (memory_type in ('short_term', 'long_term')),
  key text not null,
  value text not null,
  score numeric(4,3) not null default 0.5,
  updated_at timestamptz not null default now(),
  unique(user_id, key)
);

create table if not exists agent_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  from_agent text not null,
  to_agent text not null,
  message_type text not null check (message_type in ('state', 'analysis', 'decision', 'warning')),
  payload text not null,
  created_at timestamptz not null default now()
);

create table if not exists monthly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  month_key text not null,
  total_income bigint not null,
  total_expense bigint not null,
  net bigint not null,
  created_at timestamptz not null default now(),
  unique(user_id, month_key)
);

create index if not exists idx_transactions_user_date on transactions (user_id, created_at desc);
create index if not exists idx_allocations_user_month on allocation_ledgers (user_id, month_key, bucket);
create index if not exists idx_insights_user_date on insights (user_id, created_at desc);
create index if not exists idx_decisions_user_priority on decisions (user_id, priority_score desc, created_at desc);
create index if not exists idx_actions_user_date on actions (user_id, created_at desc);
create index if not exists idx_memories_user_key on memories (user_id, key);
create index if not exists idx_agent_messages_user_date on agent_messages (user_id, created_at desc);
create index if not exists idx_monthly_summary_user_month on monthly_summaries (user_id, month_key desc);
