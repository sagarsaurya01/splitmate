# Build log — SplitMate (Splitwise clone)

Working name: **SplitMate** (placeholder own-brand; replica-brand finalises). Not Splitwise green.

## Milestone 0 — vertical slice (2026-10-23)

| screen | status | notes |
| --- | --- | --- |
| S01 Login | done | email sign-in against seed users; Google button stubbed ("coming soon") |
| S02 Dashboard / balances | done | you-owe / you-are-owed totals + per-group net |
| S05 Groups list + create | done | name, type, member checkboxes; creator auto-added |
| S06 Group detail | done | simplified "who owes whom", expense list, add-expense form |
| S07 Add expense (equal split) | done | equal split only this milestone; payer + participants pickers |

**Verified in the browser** (localhost:3100), signed in as Sagar:
- Dashboard showed "you are owed ₹2,000" from the seeded ₹3,000 dinner split 3 ways. Correct.
- Added a 2nd expense (Anjali paid ₹900, split 3 ways). Balances recomputed to
  Ajay owes Sagar ₹1,300 and Anjali owes Sagar ₹400 — nets to zero, minimum transfers. Correct.
- No console errors.

**Data layer:** in-memory + seeded, same function signatures as the future Supabase
layer (`lib/data.ts`). replica-backend swaps the body for Supabase without touching any screen.

**Money model proven:** integer paise, balances derived (never stored), split reconciles to
cost, debt simplification = greedy min-cash-flow. Unit logic in `lib/money.ts` / `lib/data.ts`.

### Harder than expected
- The preview launcher reused a cached server ("promptvault"); ran Next directly on 3100 instead.

### Not in this milestone (by design — next milestones)
- Unequal / shares / percent splits (math already written in `lib/money.ts`, just not wired to UI)
- Add-friend + non-group split, settle-up, multi-currency entry, Google OAuth
- Real auth + persistence (Supabase) — that's replica-backend

## Next
`/replica-backend` to put it on Supabase (real auth + persistence), then wire the other split types.
