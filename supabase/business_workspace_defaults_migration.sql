-- DFT Davenue business workspace defaults.
-- Safe to run multiple times. Adds missing business accounts/categories only to business workspaces.

insert into public.accounts (user_id, workspace_id, name, type, initial_balance, current_balance, color, icon)
select workspace.user_id, workspace.id, account.name, account.type, 0, 0, account.color, account.icon
from public.workspaces workspace
cross join (
  values
    ('Business Cash', 'business', '#38BDF8', 'Briefcase'),
    ('Shopee Seller Balance', 'business', '#F472B6', 'Store'),
    ('SeaBank Davenue', 'bank', '#6366F1', 'Landmark'),
    ('Davenue ShopeePay', 'e-wallet', '#22D3EE', 'Smartphone'),
    ('Davenue GoPay', 'e-wallet', '#22C55E', 'Smartphone')
) as account(name, type, color, icon)
where workspace.type = 'business'
  and not exists (
    select 1 from public.accounts existing
    where existing.user_id = workspace.user_id
      and existing.workspace_id = workspace.id
      and existing.name = account.name
  );

insert into public.categories (user_id, workspace_id, name, type, color, icon)
select workspace.user_id, workspace.id, category.name, category.type, category.color, category.icon
from public.workspaces workspace
cross join (
  values
    ('Sales Revenue', 'income', '#22C55E', 'Store'),
    ('Owner Capital In', 'income', '#38BDF8', 'HandCoins'),
    ('Refund Received', 'income', '#22D3EE', 'RefreshCcw'),
    ('Other Business Income', 'income', '#6366F1', 'CircleDollarSign'),
    ('Inventory Purchase', 'expense', '#F43F5E', 'Package'),
    ('Shopee Fee', 'expense', '#FB7185', 'ReceiptText'),
    ('Packaging', 'expense', '#A78BFA', 'Package'),
    ('Shipping', 'expense', '#60A5FA', 'Plane'),
    ('Ads/Promotion', 'expense', '#818CF8', 'Sparkles'),
    ('Refund/Cashback', 'expense', '#F472B6', 'RefreshCcw'),
    ('Transfer Fee', 'expense', '#F59E0B', 'ArrowLeftRight'),
    ('Product Loss/Damage', 'expense', '#E11D48', 'ShieldAlert'),
    ('Owner Withdrawal', 'expense', '#FB7185', 'ArrowUpRight'),
    ('Reimbursement', 'expense', '#818CF8', 'RefreshCw'),
    ('Other Business Expense', 'expense', '#94A3B8', 'ReceiptText')
) as category(name, type, color, icon)
where workspace.type = 'business'
  and not exists (
    select 1 from public.categories existing
    where existing.user_id = workspace.user_id
      and existing.workspace_id = workspace.id
      and existing.name = category.name
      and existing.type = category.type
  );
