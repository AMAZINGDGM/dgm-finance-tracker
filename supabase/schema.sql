-- DFT - Dgm Finance Tracker
-- Run this in the Supabase SQL editor for a new project.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'id')),
  currency text not null default 'IDR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'personal' check (type in ('personal', 'business')),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'e-wallet', 'savings', 'business', 'investment', 'other')),
  initial_balance numeric not null default 0,
  current_balance numeric not null default 0,
  color text,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text,
  icon text,
  created_at timestamptz not null default now(),
  unique (user_id, name, type)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  transfer_from_account_id uuid references public.accounts(id) on delete set null,
  transfer_to_account_id uuid references public.accounts(id) on delete set null,
  date date not null,
  note text,
  source text not null default 'manual' check (source in ('manual', 'ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transaction_account_shape check (
    (
      type in ('income', 'expense')
      and account_id is not null
      and transfer_from_account_id is null
      and transfer_to_account_id is null
    )
    or
    (
      type = 'transfer'
      and account_id is null
      and transfer_from_account_id is not null
      and transfer_to_account_id is not null
      and transfer_from_account_id <> transfer_to_account_id
    )
  )
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null check (year between 2000 and 2200),
  limit_amount numeric not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, month, year)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric not null default 0 check (current_amount >= 0),
  deadline date,
  icon text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  brand text,
  category text,
  sku text,
  cost_price numeric not null default 0 check (cost_price >= 0),
  selling_price numeric not null default 0 check (selling_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 1 check (low_stock_threshold >= 0),
  condition text,
  notes text,
  sold_quantity integer not null default 0 check (sold_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  start_date date not null,
  end_date date,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text,
  parsed_result jsonb,
  action text,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);
create index if not exists workspaces_user_type_idx on public.workspaces(user_id, type);
create index if not exists accounts_workspace_idx on public.accounts(workspace_id);
create index if not exists categories_user_type_idx on public.categories(user_id, type);
create index if not exists categories_workspace_idx on public.categories(workspace_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, date desc);
create index if not exists transactions_user_type_idx on public.transactions(user_id, type);
create index if not exists transactions_workspace_date_idx on public.transactions(workspace_id, date desc);
create index if not exists transactions_category_idx on public.transactions(category_id);
create index if not exists transactions_account_idx on public.transactions(account_id);
create index if not exists budgets_user_month_idx on public.budgets(user_id, year, month);
create index if not exists budgets_workspace_month_idx on public.budgets(workspace_id, year, month);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_workspace_idx on public.goals(workspace_id);
create index if not exists products_user_workspace_idx on public.products(user_id, workspace_id);
create index if not exists products_workspace_stock_idx on public.products(workspace_id, stock_quantity);
create index if not exists capital_entries_user_workspace_date_idx on public.capital_entries(user_id, workspace_id, date desc);
create index if not exists capital_entries_account_idx on public.capital_entries(account_id);
create index if not exists recurring_user_active_idx on public.recurring_transactions(user_id, is_active);
create index if not exists ai_logs_user_created_idx on public.ai_logs(user_id, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists capital_entries_set_updated_at on public.capital_entries;
create trigger capital_entries_set_updated_at
before update on public.capital_entries
for each row execute function public.set_updated_at();

drop trigger if exists recurring_transactions_set_updated_at on public.recurring_transactions;
create trigger recurring_transactions_set_updated_at
before update on public.recurring_transactions
for each row execute function public.set_updated_at();

create or replace function public.adjust_account_balance(
  p_user_id uuid,
  p_type text,
  p_amount numeric,
  p_account_id uuid,
  p_transfer_from_account_id uuid,
  p_transfer_to_account_id uuid,
  p_direction int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_type = 'income' and p_account_id is not null then
    update public.accounts
    set current_balance = current_balance + (p_amount * p_direction),
        updated_at = now()
    where id = p_account_id and user_id = p_user_id;
  elsif p_type = 'expense' and p_account_id is not null then
    update public.accounts
    set current_balance = current_balance - (p_amount * p_direction),
        updated_at = now()
    where id = p_account_id and user_id = p_user_id;
  elsif p_type = 'transfer' then
    update public.accounts
    set current_balance = current_balance - (p_amount * p_direction),
        updated_at = now()
    where id = p_transfer_from_account_id and user_id = p_user_id;

    update public.accounts
    set current_balance = current_balance + (p_amount * p_direction),
        updated_at = now()
    where id = p_transfer_to_account_id and user_id = p_user_id;
  end if;
end;
$$;

create or replace function public.sync_transaction_account_balances()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.adjust_account_balance(
      new.user_id,
      new.type,
      new.amount,
      new.account_id,
      new.transfer_from_account_id,
      new.transfer_to_account_id,
      1
    );
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.adjust_account_balance(
      old.user_id,
      old.type,
      old.amount,
      old.account_id,
      old.transfer_from_account_id,
      old.transfer_to_account_id,
      -1
    );
    perform public.adjust_account_balance(
      new.user_id,
      new.type,
      new.amount,
      new.account_id,
      new.transfer_from_account_id,
      new.transfer_to_account_id,
      1
    );
    return new;
  elsif tg_op = 'DELETE' then
    perform public.adjust_account_balance(
      old.user_id,
      old.type,
      old.amount,
      old.account_id,
      old.transfer_from_account_id,
      old.transfer_to_account_id,
      -1
    );
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists transactions_sync_account_balances on public.transactions;
create trigger transactions_sync_account_balances
after insert or update or delete on public.transactions
for each row execute function public.sync_transaction_account_balances();

create or replace function public.create_default_finance_data()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, preferred_language, currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'en',
    'IDR'
  )
  on conflict (id) do nothing;

  insert into public.accounts (user_id, name, type, color, icon)
  values
    (new.id, 'Cash', 'cash', '#F59E0B', 'Wallet'),
    (new.id, 'BCA', 'bank', '#38BDF8', 'Landmark'),
    (new.id, 'GoPay', 'e-wallet', '#22C55E', 'Smartphone'),
    (new.id, 'Savings', 'savings', '#A78BFA', 'PiggyBank')
  on conflict do nothing;

  insert into public.categories (user_id, name, type, color, icon)
  values
    (new.id, 'Allowance', 'income', '#22C55E', 'HandCoins'),
    (new.id, 'Salary', 'income', '#16A34A', 'Briefcase'),
    (new.id, 'Freelance', 'income', '#38BDF8', 'Laptop'),
    (new.id, 'Business', 'income', '#F59E0B', 'Store'),
    (new.id, 'Gift', 'income', '#F472B6', 'Gift'),
    (new.id, 'Investment', 'income', '#A78BFA', 'TrendingUp'),
    (new.id, 'Other Income', 'income', '#94A3B8', 'Plus'),
    (new.id, 'Food & Drinks', 'expense', '#F97316', 'Utensils'),
    (new.id, 'Transport', 'expense', '#38BDF8', 'Car'),
    (new.id, 'Shopping', 'expense', '#F43F5E', 'ShoppingBag'),
    (new.id, 'Education', 'expense', '#A78BFA', 'GraduationCap'),
    (new.id, 'Entertainment', 'expense', '#F59E0B', 'Gamepad2'),
    (new.id, 'Bills', 'expense', '#EF4444', 'ReceiptText'),
    (new.id, 'Health', 'expense', '#22C55E', 'HeartPulse'),
    (new.id, 'Subscription', 'expense', '#60A5FA', 'RefreshCcw'),
    (new.id, 'Emergency', 'expense', '#F97316', 'ShieldAlert'),
    (new.id, 'Family', 'expense', '#F472B6', 'Users'),
    (new.id, 'Other Expense', 'expense', '#94A3B8', 'Minus')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_dft_defaults on auth.users;
create trigger on_auth_user_created_create_dft_defaults
after insert on auth.users
for each row execute function public.create_default_finance_data();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.products enable row level security;
alter table public.capital_entries enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.ai_logs enable row level security;

grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.capital_entries to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
using (id = auth.uid());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
on public.profiles for delete
using (id = auth.uid());

drop policy if exists "Users manage own workspaces" on public.workspaces;
create policy "Users manage own workspaces"
on public.workspaces for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own accounts" on public.accounts;
create policy "Users manage own accounts"
on public.accounts for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own categories" on public.categories;
create policy "Users manage own categories"
on public.categories for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Users manage own transactions"
on public.transactions for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own budgets" on public.budgets;
create policy "Users manage own budgets"
on public.budgets for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own goals" on public.goals;
create policy "Users manage own goals"
on public.goals for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own products" on public.products;
create policy "Users manage own products"
on public.products for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own capital entries" on public.capital_entries;
create policy "Users manage own capital entries"
on public.capital_entries for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own recurring transactions" on public.recurring_transactions;
create policy "Users manage own recurring transactions"
on public.recurring_transactions for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users manage own ai logs" on public.ai_logs;
create policy "Users manage own ai logs"
on public.ai_logs for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
