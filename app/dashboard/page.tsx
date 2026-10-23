import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { currentUser } from "@/lib/session";
import { userSummary } from "@/lib/data";
import { formatMoney } from "@/lib/money";

export default function DashboardPage() {
  const me = currentUser();
  if (!me) redirect("/login");

  const { owed, owe, perGroup } = userSummary(me.id);
  const nothing = perGroup.length === 0;

  return (
    <>
      <Nav user={me} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-xl font-bold text-ink">Balances</h1>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              You are owed
            </p>
            <p className="mt-1 text-2xl font-bold text-owed">{formatMoney(owed)}</p>
          </div>
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              You owe
            </p>
            <p className="mt-1 text-2xl font-bold text-owe">{formatMoney(owe)}</p>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Your groups
          </h2>
          <Link href="/groups" className="text-sm font-semibold text-brand">
            View all
          </Link>
        </div>

        {nothing ? (
          <div className="card text-center text-sm text-muted">
            <p className="mb-3">You have no groups yet.</p>
            <Link href="/groups" className="btn">Create a group</Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {perGroup.map(({ group, net }) => (
              <li key={group.id}>
                <Link
                  href={`/groups/${group.id}`}
                  className="card flex items-center justify-between hover:border-brand"
                >
                  <span className="font-semibold text-ink">{group.name}</span>
                  <span
                    className={
                      net > 0 ? "font-semibold text-owed" : net < 0 ? "font-semibold text-owe" : "text-muted"
                    }
                  >
                    {net === 0
                      ? "settled up"
                      : net > 0
                      ? `you are owed ${formatMoney(net)}`
                      : `you owe ${formatMoney(-net)}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
