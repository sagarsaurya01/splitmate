# SplitMate

A clean-room expense-sharing app in the style of Splitwise — split bills with
friends and groups, and see who owes whom, with debts simplified to the fewest
payments. Built with the [Replica](https://github.com/Jakeschincariol/replica-skill)
method: it rebuilds what the app *does*, never its code, brand or content.

**Status:** Milestone 0 (working vertical slice). Sign in → create a group →
add an equal-split expense → see simplified balances. All verified in the browser.

## Stack

Next.js (App Router) + TypeScript + Tailwind. Data is an in-memory seeded layer
today; the function signatures match a Supabase backend, which replaces it next
(`replica-backend`) without changing any screen.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3100 and sign in with a demo account (`sagar@demo.in`,
`anjali@demo.in` or `ajay@demo.in`).

## The money model

- Money is stored as **integer paise** + a currency code — never floats.
- **Balances are derived** (sum of paid − owed), never stored, so nothing drifts.
- Every split reconciles exactly to the expense amount; remainder paise are
  distributed deterministically.
- **Settle-up is just an expense** flagged as a payment — same math.
- **Debt simplification** is a greedy min-cash-flow match (biggest creditor ↔
  biggest debtor).

Core logic: `lib/money.ts`, `lib/data.ts`. The clone plan is in `replica/`.

## What's next

Unequal / shares / percent splits (math is already written), add-friend and
non-group splits, settle-up, multi-currency, Google OAuth, and the Supabase
backend. See `replica/features.csv` and `replica/build-log.md`.
