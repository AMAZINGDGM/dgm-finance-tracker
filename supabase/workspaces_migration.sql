-- DFT workspace system migration.
-- Run this after the existing schema to add Personal/Business workspace support.

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'personal' check (type in ('personal', 'business')),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.accounts
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.categories
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.transactions
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.budgets
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.goals
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.recurring_transactions
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

insert into public.workspaces (user_id, name, type)
select users.id, 'Personal Finance', 'personal'
from auth.users users
where not exists (
  select 1 from public.workspaces workspaces
  where workspaces.user_id = users.id and workspaces.type = 'personal'
);

update public.accounts accounts
set workspace_id = workspaces.id
from public.workspaces workspaces
where accounts.user_id = workspaces.user_id
  and workspaces.type = 'personal'
  and accounts.workspace_id is null;

update public.categories categories
set workspace_id = workspaces.id
from public.workspaces workspaces
where categories.user_id = workspaces.user_id
  and workspaces.type = 'personal'
  and categories.workspace_id is null;

update public.transactions transactions
set workspace_id = workspaces.id
from public.workspaces workspaces
where transactions.user_id = workspaces.user_id
  and workspaces.type = 'personal'
  and transactions.workspace_id is null;

update public.budgets budgets
set workspace_id = workspaces.id
from public.workspaces workspaces
where budgets.user_id = workspaces.user_id
  and workspaces.type = 'personal'
  and budgets.workspace_id is null;

update public.goals goals
set workspace_id = workspaces.id
from public.workspaces workspaces
where goals.user_id = workspaces.user_id
  and workspaces.type = 'personal'
  and goals.workspace_id is null;

update public.recurring_transactions recurring
set workspace_id = workspaces.id
from public.workspaces workspaces
where recurring.user_id = workspaces.user_id
  and workspaces.type = 'personal'
  and recurring.workspace_id is null;

create index if not exists workspaces_user_type_idx on public.workspaces(user_id, type);
create index if not exists accounts_workspace_idx on public.accounts(workspace_id);
create index if not exists categories_workspace_idx on public.categories(workspace_id);
create index if not exists transactions_workspace_date_idx on public.transactions(workspace_id, date desc);
create index if not exists budgets_workspace_month_idx on public.budgets(workspace_id, year, month);
create index if not exists goals_workspace_idx on public.goals(workspace_id);

alter table public.categories
  drop constraint if exists categories_user_id_name_type_key;

create unique index if not exists categories_user_workspace_name_type_idx
on public.categories(user_id, workspace_id, name, type);

alter table public.workspaces enable row level security;

drop policy if exists "Users manage own workspaces" on public.workspaces;
create policy "Users manage own workspaces"
on public.workspaces for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
