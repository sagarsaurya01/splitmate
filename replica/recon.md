# Recon map: Splitwise (Web + mobile)

Scope: the core expense-sharing loop — friends and groups, logging a split expense (equal / unequal / shares / %), running balances, debt simplification, and settling up. Payments integrations, receipt OCR and charts are out of the first slice.
For: Sagar's own build, to be rebranded and sold (clean-room clone of what the app does, not its code/assets).
Date: 2026-10-23

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | official API docs | https://dev.splitwise.com/ | best source: full data model, enums, endpoints |
| 2 | help center | https://feedback.splitwise.com/knowledgebase | 76 articles: splits, simplify, groups, payments |
| 3 | Pro page | https://www.splitwise.com/pro | which features are gated → which matter |
| 4 | iOS App Store | https://apps.apple.com/us/app/splitwise/id458023433 | feature list, 4.0★ / ~29K, Pro prices |
| 5 | Google Play | com.Splitwise.SplitwiseMobile | screenshots, description |
| 6 | user reviews (Trustpilot, Play, unitQ) | see replica-entrepreneur later | free-tier ad/limit complaints |

## Core loop

One person pays for something shared; they log it, split it among a group or friends; everyone sees an up-to-date "who owes whom"; debts are simplified; people settle up.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Sign up / Log in | /login, /signup | auth (email + Google) | form, OAuth button | empty, error, loading |
| S02 | Dashboard / All balances | /dashboard | total you owe / are owed, per-person list | balance card, list rows, FAB "Add expense" | empty (no friends), filled |
| S03 | Friends list | /friends | friends + per-friend balance | list rows, add-friend | empty, filled |
| S04 | Friend detail | /friends/:id | shared expense history + balance with one person | expense list, balance header, settle button | empty, filled |
| S05 | Groups list | /groups | all groups + your balance in each | group cards | empty, filled |
| S06 | Group detail | /groups/:id | group expenses, member balances, simplified debts | expense list, balances panel, members, settings | empty, filled, settled-up |
| S07 | Add / edit expense | modal from FAB | the heart: description, cost, payer(s), split method | amount input, payer picker, split-type tabs, per-person shares | equal, unequal, shares, %, multi-payer, validation error |
| S08 | Settle up | from S04/S06 | record a payment from A to B | from/to picker, amount, date | default amount, custom |
| S09 | Expense detail | /expenses/:id | one expense, its shares, comments, edit history | share breakdown, comments, edit/delete | filled, deleted/undo |
| S10 | Create / edit group | modal | name, type, members, simplify toggle | name input, type picker, member invite | new, editing |
| S11 | Activity feed | /activity | chronological notifications | feed rows | empty, filled |
| S12 | Account settings | /account | name, email, default currency, password | form | — |

## Flows

```
F01 Log a split expense (core loop)
    S02 -> S07 (enter cost, pick payer, pick split) -> back to S02/S06 with updated balances
    happy path clicks: ~5 (open, amount, description, split, save)
    edge: unequal shares don't sum to total, 0 payers, single-person group, currency mismatch

F02 Add a friend and split outside a group
    S02 -> S03 add friend (email) -> S07 split a bill with them -> S04 shows balance
    edge: friend has no account yet (invite pending), duplicate email

F03 Create a group and add members
    S05 -> S10 create group (type, members) -> S06 -> S07 add expenses
    edge: member without email, leaving a group with an open balance

F04 Settle up
    S04/S06 -> S08 record payment -> balances go to zero / reduce
    edge: partial payment, settle more than owed

F05 Simplify debts
    S06 group with simplify on -> original_debts collapse into simplified_debts
    edge: simplify changes nothing (already minimal)
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, danger | default, hover, focus, disabled, loading | all |
| Balance row | you-owe (orange), owed-to-you (green), settled (grey) | — | S02,S03,S04,S05,S06 |
| Amount input | currency-prefixed | default, invalid | S07,S08 |
| Split-type tabs | equal, unequal, shares, percent, exact | selected, per-row entry | S07 |
| Expense list row | — | normal, settlement, deleted | S04,S06,S09 |
| Avatar | user photo / initials fallback | — | everywhere |
| FAB | "Add expense" | — | S02,S04,S06 |
| Modal | expense, group, settle | open, saving, error | S07,S08,S10 |

## Inferred data model

```
User      id, first_name, last_name, email, password_hash, picture, default_currency, locale
          evidence: get_current_user, update_user  | confidence: high

Friendship id, user_a, user_b, status (pending|confirmed)
          evidence: get_friends, registration_status | confidence: high

Group     id, name, group_type (home|trip|couple|apartment|house|other),
          simplify_by_default (bool), avatar, invite_link, created_by
          evidence: get_group, group_type enum | confidence: high

GroupMember group_id, user_id  (join)  | confidence: high

Expense   id, group_id (0 = non-group), description, cost (decimal), currency_code,
          category_id, date, details, created_by, repeats (bool),
          repeat_interval (never|weekly|fortnightly|monthly|yearly), deleted_at
          evidence: Expense fields, repeat_interval enum | confidence: high

ExpenseShare expense_id, user_id, paid_share (decimal), owed_share (decimal), net_balance
          evidence: ExpenseUser (users__index__paid_share/owed_share) | confidence: high
          NOTE: balances derive from summing paid_share - owed_share per user. This is the
          whole money model; get it exactly right.

Settlement a payment Expense with payment=true: from user, to user, amount
          evidence: repayments, "payment" flag | confidence: high

Comment   id, expense_id, user_id, content, comment_type, created_at
          evidence: get_comments | confidence: high

Notification id, user_id, type (0..15), source(type,id,url), content, created_at
          evidence: notification type enum | confidence: high

Currency  code, unit    | Category id, name, parent, icon (seed static)
```

Relationships: User n-n User (Friendship); User n-n Group (GroupMember); Group 1-n Expense; Expense 1-n ExpenseShare; Expense 1-n Comment; User 1-n Notification.

## Feature matrix

See `features.csv`. Must: 12, should: 7, could: 4, skip: 5.

## Out of scope (cannot or should not be cloned)

- **Payment rails** (Venmo, PayPal, Paytm) — third-party, regulated, region-locked. Settlements are "record a payment" only, like Splitwise's manual settle.
- **Transaction import / bank linking** — needs a data aggregator (Plaid etc.), US-only, licensed.
- **Receipt OCR / scanning** — a paid ML feature; skip in v1, could add later with an OCR API.
- **The Splitwise user network** — their existing users aren't a feature.
- **Their brand** — name, logo, colours, copy, the green mascot. Rebrand step handles this.

## Size

Screens 12, flows 5, entities ~11. Hard parts: the split math (equal/unequal/shares/%/exact + multi-payer must always reconcile to the cost), debt simplification (min-cash-flow graph algorithm), real-time balance updates across members, multi-currency. **Size: M** — a few weeks for a solid clone; a working first slice (auth + group + equal/unequal split + balances) is an S, ~1–1.5 hrs of build as Sir wants.

## Next step

`/replica-architect` — pick the stack (lean Next.js + Supabase so it deploys the same way as the Dussehra app), turn this data model into SQL with the balance math nailed down, and order the build as a thin vertical slice: sign in → create group → add an equal-split expense → see balances.
