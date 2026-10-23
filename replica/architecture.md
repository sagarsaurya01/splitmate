# Architecture: Splitwise clone

From `recon.md` + `features.csv`. Date: 2026-10-23.

## Stack

| layer | choice | why |
| --- | --- | --- |
| web app | Next.js (App Router) + TypeScript | same stack family as the Dussehra app; one deploy method |
| styling | Tailwind + tokens from replica-design | fast, tokens keep rebrand clean |
| database | **Supabase** (Postgres) | same backend as the Dussehra/Supabase task on Sir's list — one place to manage |
| data access | Supabase JS client + RLS, raw SQL for balances | the money math is SQL; keep it explicit, not hidden in an ORM |
| auth | Supabase Auth (email + Google OAuth) | built in, matches the data model, no extra service |
| email | Resend | invite + settle-up notifications later; skip in slice 1 |
| hosting | Vercel | Next.js native; free at zero users |
| jobs | Vercel Cron | recurring expenses (should-have), not in slice 1 |

One database. No microservices. No payment rails (out of scope — settle-up is manual).

## Schema

Full SQL in `replica/schema.sql`. 8 tables + 1 view:
`profiles, friendships, groups, group_members, expenses, expense_shares, comments, notifications` + `pairwise_balances` view.

**The money model — the one thing to get exactly right:**
- Money = integer **minor units** (paise) + `currency_code`. Never floats.
- `expense_shares` holds, per participant: `paid_minor` (what they put in) and `owed_minor` (their portion). A participant's net on an expense = `paid − owed`.
- **Invariant:** for every expense, `sum(paid) = sum(owed) = amount`. Enforced in the data layer before insert (it spans rows, so not a single CHECK). Reject the write if it doesn't balance.
- **Settle-up** is just an expense with `is_payment = true`: payer `paid = amount, owed = 0`; recipient `paid = 0, owed = amount`. No special table — balances fall out of the same sum.
- **Balances are derived, never stored.** A stored balance column is the #1 way these apps drift. The `pairwise_balances` view sums net per pair per currency.

**Split types** (all resolved in the app layer into `owed_minor` rows that sum to the cost):
- *equal*: `amount / n`, distribute the remainder paise one-by-one to the first rows so the sum is exact (no lost paise).
- *exact*: user types each amount; validate `sum = amount`.
- *shares*: weights `w_i`; `owed_i = round(amount * w_i / Σw)`, fix remainder on the largest share.
- *percent*: validate `Σ% = 100`; same rounding fix.
- *multi-payer*: `paid_minor` can be non-zero on more than one row; validate `Σpaid = amount`.

**RLS:** a row is visible only to members of its group (or participants of a non-group expense). Policies written as the first migration.

## API (server actions / route handlers)

| action | does | who | input | flow |
| --- | --- | --- | --- | --- |
| signUp / signIn | Supabase Auth | public | email+pw / Google | F-auth |
| addFriend | create friendship (pending if invitee has no account) | auth user | email | F02 |
| listFriends | friends + derived balance | auth user | — | S03 |
| createGroup | group + membership | auth user | name,type,members | F03 |
| addMember | add to group | member | user/email | F03 |
| createExpense | validate split → insert expense + shares in a txn | member/participant | cost,payers,split | F01 |
| updateExpense / deleteExpense | edit / soft-delete (`deleted_at`) | participant | — | S09 |
| settleUp | createExpense with is_payment=true | participant | from,to,amount | F04 |
| groupBalances | original + simplified debts | member | group_id | F05 |
| addComment / listComments | per expense | participant | text | S09 |
| listActivity | notifications feed | auth user | — | S11 |

All writes go through a server action that runs the balance validation; the client never writes shares directly.

## The parts that bite

- **Rounding / lost paise** — distribute remainders deterministically; always re-check `Σ = amount` server-side.
- **Debt simplification** (F05) — min-cash-flow: net every member to a single figure, then greedily match biggest creditor to biggest debtor. O(n log n) per settle. Only within one currency.
- **Multi-currency** — never sum across currencies; balances are per-currency. Conversion is a Pro/out-of-scope feature.
- **Concurrent edits** — anyone in a group can edit an expense (like the original). Soft-delete + `updated_at`; last write wins, keep an edit trail later.
- **Race on settle** — wrap expense+shares insert in one transaction so a half-written split can never exist.
- **Auth boundary** — RLS is the backstop; never trust a group_id from the client without checking membership.

## Build order

**Milestone 0 — vertical slice (the ~1–1.5 hr first version Sir wants):**
sign in → create a group with members → add one equal-split expense → see who owes whom.
Screens S01, S05/S06, S07, S02. Tables: all 8. Routes: signIn, createGroup, createExpense, groupBalances.

**Milestone 1 — must-haves:** unequal / shares / percent splits, add-friend + non-group split (F02), settle-up (F04), multi-currency storage, Google OAuth.

**Milestone 2 — should-haves:** debt simplification, comments, activity feed, recurring expenses, categories, edit history/undo.

**Milestone 3 — could-haves:** CSV export, avatars/cover photos, search, category charts.

**Milestone 4:** the fixes replica-entrepreneur surfaces (likely: no forced ads, no daily expense cap — the top free-tier complaints).

## Summary

Stack: Next.js + Supabase + Tailwind on Vercel. Tables: 8 + 1 view. Routes: ~12 server actions. Riskiest: (1) split rounding must always reconcile to cost, (2) debt simplification, (3) multi-currency balances kept separate. Next: `/replica-design`.
