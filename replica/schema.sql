-- Splitwise clone — schema (Postgres / Supabase)
-- Money is stored as integer minor units (paise/cents) + a currency code. Never floats.
-- Balances are DERIVED (sum of paid - owed), never stored as a mutable column.
-- RLS: a user can see/write rows only for groups/friendships they belong to.

-- ---------- profiles (1-1 with auth.users) ----------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text not null,
  last_name   text not null default '',
  email       text not null unique,
  picture_url text,
  default_currency text not null default 'INR',
  locale      text not null default 'en',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- friendships (undirected pair) ----------
create table friendships (
  id        uuid primary key default gen_random_uuid(),
  user_low  uuid not null references profiles(id) on delete cascade,
  user_high uuid not null references profiles(id) on delete cascade,
  status    text not null default 'confirmed' check (status in ('pending','confirmed')),
  created_at timestamptz not null default now(),
  -- store the pair canonically (low<high) so each pair exists once
  constraint ordered_pair check (user_low < user_high),
  unique (user_low, user_high)
);

-- ---------- groups ----------
create table groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  group_type text not null default 'other'
    check (group_type in ('home','trip','couple','apartment','house','other')),
  simplify_by_default boolean not null default false,
  avatar_url text,
  created_by uuid not null references profiles(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id  uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on group_members (user_id);

-- ---------- expenses ----------
-- group_id null = a non-group expense between friends.
-- is_payment = true marks a settle-up ("A paid B"), handled by the same share math:
--   payer has paid_share = amount, recipient has owed_share = amount.
create table expenses (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid references groups(id) on delete cascade,
  description   text not null,
  amount_minor  bigint not null check (amount_minor > 0),
  currency_code text not null default 'INR',
  category      text,
  spent_at      date not null default current_date,
  details       text,
  is_payment    boolean not null default false,
  repeat_interval text not null default 'never'
    check (repeat_interval in ('never','weekly','fortnightly','monthly','yearly')),
  created_by    uuid not null references profiles(id) on delete set null,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on expenses (group_id, spent_at);
create index on expenses (created_by);

-- ---------- shares: the whole money model ----------
-- One row per participant per expense. paid_share = what they put in,
-- owed_share = their portion of the cost. A user's net on this expense is
-- paid_share - owed_share (positive = they are owed).
-- INVARIANT enforced in the app layer (not DB, because it spans rows):
--   sum(paid_share) = sum(owed_share) = expenses.amount_minor
create table expense_shares (
  expense_id  uuid not null references expenses(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  paid_minor  bigint not null default 0 check (paid_minor >= 0),
  owed_minor  bigint not null default 0 check (owed_minor >= 0),
  primary key (expense_id, user_id)
);
create index on expense_shares (user_id);

-- ---------- comments ----------
create table comments (
  id         uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete set null,
  content    text not null,
  created_at timestamptz not null default now()
);
create index on comments (expense_id);

-- ---------- notifications / activity feed ----------
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       smallint not null,           -- 0 expense added .. 15 (see recon enum)
  source_type text,                        -- 'expense' | 'group' | 'friendship'
  source_id  uuid,
  content    text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, created_at desc);

-- ---------- derived balance view (pairwise net) ----------
-- Net that `user_id` is owed by `other_id` for a given currency.
-- Positive => other_id owes user_id. This is computed, never stored.
create view pairwise_balances as
select
  s_me.user_id              as user_id,
  s_them.user_id            as other_id,
  e.group_id                as group_id,
  e.currency_code           as currency_code,
  sum( (s_me.paid_minor - s_me.owed_minor) )::bigint as net_minor
from expenses e
join expense_shares s_me   on s_me.expense_id = e.id
join expense_shares s_them on s_them.expense_id = e.id and s_them.user_id <> s_me.user_id
where e.deleted_at is null
group by s_me.user_id, s_them.user_id, e.group_id, e.currency_code;
-- NOTE: this is the simple per-pair attribution; for multi-payer/multi-party
-- expenses the exact pairwise split is resolved in the data layer. See architecture.md.

-- RLS policies (sketch; full policies in migration):
-- profiles: self read/write; others readable if sharing a group or friendship.
-- groups/expenses/shares: visible iff auth.uid() is a member of the group,
--   or (non-group) is a participant in the expense.
