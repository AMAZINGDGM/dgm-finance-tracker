-- DFT business inventory products.
-- Run this after the workspace migration.

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

create index if not exists products_user_workspace_idx on public.products(user_id, workspace_id);
create index if not exists products_workspace_stock_idx on public.products(workspace_id, stock_quantity);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;

grant select, insert, update, delete on public.products to authenticated;

drop policy if exists "Users manage own products" on public.products;
create policy "Users manage own products"
on public.products for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
