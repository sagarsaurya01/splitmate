import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import { currentUser } from "@/lib/session";
import { userSummary } from "@/lib/data";
import { formatMoney } from "@/lib/money";

export default function DashboardPage() {
  const me = currentUser();
  if (!me) redirect("/login");

  const { owed, owe, perGroup } = userSummary(me.id);
  const nothing = perGroup.length === 0;
  const addHref = perGroup.length === 1 ? `/groups/${perGroup[0].group.id}#add` : "/groups";
  const total = owed - owe;

  return (
    <Shell user={me} active="dashboard" addHref={addHref}>
      {/* header summary, Splitwise-style */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">total balance</p>
            <p className={`text-lg font-bold ${total >= 0 ? "text-owed" : "text-owe"}`}>{formatMoney(total)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">you owe</p>
            <p className="text-lg font-bold text-owe">{formatMoney(owe)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">you are owed</p>
            <p className="text-lg font-bold text-owed">{formatMoney(owed)}</p>
          </div>
        </div>
      </div>

      {nothing ? (
        <div className="card text-center text-sm text-muted">
          <p className="mb-3">You're all settled up — no groups yet.</p>
          <Link href="/groups" className="btn-coral inline-flex">Create a group</Link>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Your groups</p>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {perGroup.map(({ group, net }) => (
              <li key={group.id}>
                <Link href={`/groups/${group.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-bg">
                  <Avatar name={group.name} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{group.name}</span>
                    <span className="block text-xs capitalize text-muted">{group.groupType}</span>
                  </span>
                  <span className="text-right">
                    {net === 0 ? (
                      <span className="text-sm text-muted">settled up</span>
                    ) : (
                      <>
                        <span className={`block text-xs ${net > 0 ? "text-owed" : "text-owe"}`}>{net > 0 ? "you are owed" : "you owe"}</span>
                        <span className={`block font-bold ${net > 0 ? "text-owed" : "text-owe"}`}>{formatMoney(Math.abs(net))}</span>
                      </>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Shell>
  );
}
