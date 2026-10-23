import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
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
    <Shell user={me} active="groups" addHref={`/groups/${group.id}#add`}>
        <div className="mb-4 flex items-center gap-3 border-b border-line pb-4">
          <Avatar name={group.name} size={48} />
          <div>
            <h1 className="text-2xl font-bold text-ink">{group.name}</h1>
            <p className="text-xs capitalize text-muted">{group.groupType}</p>
          </div>
        </div>

        {/* Simplified balances */}
        <section className="card mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Who owes whom
          </h2>
          {debts.length === 0 ? (
            <p className="text-sm text-muted">Everyone is settled up. 🎉</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {debts.map((d, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Avatar name={name(d.from)} size={26} />
                  <span className="text-ink">
                    <span className="font-semibold text-owe">{name(d.from)}</span> owes{" "}
                    <span className="font-semibold text-owed">{name(d.to)}</span>
                  </span>
                  <span className="ml-auto font-bold text-ink">{formatMoney(d.amountMinor)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Expenses */}
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            Expenses
          </h2>
          {expenses.length === 0 ? (
            <div className="card text-sm text-muted">No expenses yet. Add the first one below.</div>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {expenses.map((e) => {
                const payer = e.shares.find((s) => s.paidMinor > 0);
                return (
                  <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={e.description} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{e.description}</p>
                      <p className="text-xs text-muted">
                        {name(payer?.userId ?? e.createdBy)} paid &middot; {e.spentAt}
                      </p>
                    </div>
                    <span className="font-bold text-ink">{formatMoney(e.amountMinor, e.currencyCode)}</span>
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
            <button className="btn-coral" type="submit">Add expense</button>
          </form>
        </section>
    </Shell>
  );
}
