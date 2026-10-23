import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { User, getGroupsForUser } from "@/lib/data";
import { userSummary } from "@/lib/data";
import { formatMoney } from "@/lib/money";

// Splitwise-style three-pane feel: a white left sidebar (brand, the big
// Add expense / Settle up buttons, Dashboard, and the group list), then the
// content column on a light-grey ground.
export default function Shell({
  user, active, addHref, children,
}: {
  user: User;
  active: "dashboard" | "groups";
  addHref: string;
  children: React.ReactNode;
}) {
  const groups = getGroupsForUser(user.id);
  const { owed, owe } = userSummary(user.id);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl gap-0 md:gap-6 md:px-4 md:py-6">
      {/* sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col md:flex">
        <div className="mb-4 flex items-center gap-2 px-1">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-sm font-bold text-white">SM</span>
          <span className="text-lg font-bold text-ink">SplitMate</span>
        </div>
        <div className="mb-4 flex flex-col gap-2">
          <Link href={addHref} className="btn-coral w-full">+ Add an expense</Link>
          <Link href={addHref.replace("#add", "#settle")} className="btn w-full">Settle up</Link>
        </div>
        <nav className="flex flex-col gap-0.5 text-sm">
          <Link href="/dashboard" className={`rounded-md px-3 py-2 font-semibold ${active === "dashboard" ? "bg-brand-soft text-brand" : "text-ink hover:bg-bg"}`}>Dashboard</Link>
          <Link href="/groups" className={`rounded-md px-3 py-2 font-semibold ${active === "groups" ? "bg-brand-soft text-brand" : "text-ink hover:bg-bg"}`}>Groups</Link>
        </nav>
        <p className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Your groups</p>
        <ul className="flex flex-col gap-0.5 text-sm">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/groups/${g.id}`} className="block truncate rounded-md px-3 py-1.5 text-ink hover:bg-bg">{g.name}</Link>
            </li>
          ))}
          {groups.length === 0 && <li className="px-3 py-1 text-xs text-muted">No groups yet</li>}
        </ul>
        <div className="mt-auto border-t border-line pt-3">
          <p className="px-1 text-xs text-muted">Signed in as {user.firstName}</p>
          <form action={signOutAction}><button className="px-1 pt-1 text-xs text-muted hover:text-ink" type="submit">Sign out</button></form>
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
          <span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-xs font-bold text-white">SM</span><b className="text-ink">SplitMate</b></span>
          <Link href={addHref} className="btn-coral">+ Add</Link>
        </header>
        <div className="flex-1 px-4 py-4 md:px-0 md:py-0">{children}</div>
      </div>
    </div>
  );
}
