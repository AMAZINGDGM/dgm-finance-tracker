-- DFT business capital ledger entries.
-- Run this after the workspace migration.

create table if not exists public.capital_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null check (type in ('owner_capital_in', 'owner_withdrawal', 'reimbursement')),
  amount numeric not null default 0 check (amount > 0),
  account_id uuid references public.accounts(id) on delete set null,
  date date not null default current_date,
  notes text,
  source text,
  reference text,
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists capital_entries_user_workspace_date_idx
on public.capital_entries(user_id, workspace_id, date desc);

create index if not exists capital_entries_account_idx on public.capital_entries(account_id);

drop trigger if exists capital_entries_set_updated_at on public.capital_entries;
create trigger capital_entries_set_updated_at
before update on public.capital_entries
for each row execute function public.set_updated_at();

alter table public.capital_entries enable row level security;

grant select, insert, update, delete on public.capital_entries to authenticated;

drop policy if exists "Users manage own capital entries" on public.capital_entries;
create policy "Users manage own capital entries"
on public.capital_entries for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
