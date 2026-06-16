-- Final Davenue Business account defaults.
-- Safe to run more than once. It preserves account ids, avoids duplicate inserts,
-- and only renames old generic accounts when the canonical Davenue account is missing.

update public.accounts account
set
  name = 'SeaBank Davenue',
  type = 'bank',
  color = '#6366F1',
  icon = 'Landmark',
  updated_at = now()
from public.workspaces workspace
where account.workspace_id = workspace.id
  and workspace.type = 'business'
  and lower(account.name) = lower('Business Bank')
  and not exists (
    select 1
    from public.accounts existing
    where existing.workspace_id = account.workspace_id
      and existing.user_id = account.user_id
      and lower(existing.name) = lower('SeaBank Davenue')
  );

update public.accounts account
set
  name = 'Davenue ShopeePay',
  type = 'e-wallet',
  color = '#22D3EE',
  icon = 'Smartphone',
  updated_at = now()
from public.workspaces workspace
where account.workspace_id = workspace.id
  and workspace.type = 'business'
  and lower(account.name) = lower('Business E-wallet')
  and not exists (
    select 1
    from public.accounts existing
    where existing.workspace_id = account.workspace_id
      and existing.user_id = account.user_id
      and lower(existing.name) = lower('Davenue ShopeePay')
  );

insert into public.accounts (user_id, workspace_id, name, type, initial_balance, current_balance, color, icon)
select workspace.user_id, workspace.id, defaults.name, defaults.type, 0, 0, defaults.color, defaults.icon
from public.workspaces workspace
cross join (
  values
    ('Business Cash', 'cash', '#38BDF8', 'Wallet'),
    ('Shopee Seller Balance', 'business', '#F472B6', 'Store'),
    ('SeaBank Davenue', 'bank', '#6366F1', 'Landmark'),
    ('Davenue ShopeePay', 'e-wallet', '#22D3EE', 'Smartphone'),
    ('Davenue GoPay', 'e-wallet', '#22C55E', 'Smartphone')
) as defaults(name, type, color, icon)
where workspace.type = 'business'
  and not exists (
    select 1
    from public.accounts existing
    where existing.workspace_id = workspace.id
      and existing.user_id = workspace.user_id
      and lower(existing.name) = lower(defaults.name)
  );

insert into public.categories (user_id, workspace_id, name, type, color, icon)
select workspace.user_id, workspace.id, defaults.name, defaults.type, defaults.color, defaults.icon
from public.workspaces workspace
cross join (
  values
    ('Balance Adjustment', 'income', '#22C55E', 'Scale'),
    ('Balance Adjustment', 'expense', '#F43F5E', 'Scale')
) as defaults(name, type, color, icon)
where not exists (
    select 1
    from public.categories existing
    where existing.workspace_id = workspace.id
      and existing.user_id = workspace.user_id
      and existing.type = defaults.type
      and lower(existing.name) = lower(defaults.name)
  );
