import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { currentUser } from "@/lib/session";
import {
  getGroup,
  getExpensesForGroup,
  getUser,
  netByUser,
  simplifyDebts,
} from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { addExpenseAction } from "@/app/actions";

const name = (id: string) => getUser(id)?.firstName ?? "Someone";

export default function GroupPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const me = currentUser();
  if (!me) redirect("/login");
  const group = getGroup(params.id);
  if (!group || !group.memberIds.includes(me.id)) notFound();

  const expenses = getExpensesForGroup(group.id);
  const net = netByUser(expenses);
  const debts = simplifyDebts(net);
  const members = group.memberIds.map((id) => getUser(id)!).filter(Boolean);

  return (
    <>
      <Nav user={me} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4">
          <Link href="/groups" className="text-sm text-muted hover:text-ink">&larr; Groups</Link>
          <h1 className="mt-1 text-xl font-bold text-ink">{group.name}</h1>
          <p className="text-xs uppercase tracking-wide text-muted">{group.groupType}</p>
        </div>

        {/* Simplified balances */}
        <section className="card mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Who owes whom
          </h2>
          {debts.length === 0 ? (
            <p className="text-sm text-muted">Everyone is settled up.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {debts.map((d, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-ink">
                    <span className="font-semibold text-owe">{name(d.from)}</span> owes{" "}
                    <span className="font-semibold text-owed">{name(d.to)}</span>
                  </span>
                  <span className="font-semibold text-ink">{formatMoney(d.amountMinor)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Expenses */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Expenses
          </h2>
          {expenses.length === 0 ? (
            <div className="card text-sm text-muted">No expenses yet. Add the first one below.</div>
          ) : (
            <ul className="space-y-2">
              {expenses.map((e) => {
                const payer = e.shares.find((s) => s.paidMinor > 0);
                return (
                  <li key={e.id} className="card flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-ink">{e.description}</p>
                      <p className="text-xs text-muted">
                        {name(payer?.userId ?? e.createdBy)} paid &middot; {e.spentAt}
                      </p>
                    </div>
                    <span className="font-semibold text-ink">{formatMoney(e.amountMinor, e.currencyCode)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Add equal-split expense */}
        <section className="card scroll-mt-4" id="add">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Add an expense (split equally)
          </h2>
          {searchParams.error === "input" && (
            <p className="mb-3 text-sm text-owe">Enter a description, an amount, and at least one person.</p>
          )}
          <form action={addExpenseAction} className="space-y-4">
            <input type="hidden" name="groupId" value={group.id} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="description">Description</label>
                <input id="description" name="description" required className="field" placeholder="Lunch" />
              </div>
              <div>
                <label className="label" htmlFor="amount">Amount (₹)</label>
                <input id="amount" name="amount" type="number" step="0.01" min="0.01" required className="field" placeholder="1200.00" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="payerId">Paid by</label>
              <select id="payerId" name="payerId" className="field" defaultValue={me.id}>
                {members.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="label">Split between</legend>
              <div className="flex flex-wrap gap-3">
                {members.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" name="participantIds" value={u.id} defaultChecked />
                    {u.firstName}
                  </label>
                ))}
              </div>
            </fieldset>
            <button className="btn" type="submit">Add expense</button>
          </form>
        </section>
      </main>
    </>
  );
}
