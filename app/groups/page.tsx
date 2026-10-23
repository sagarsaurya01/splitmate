import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import { currentUser } from "@/lib/session";
import { getGroupsForUser, getUsers } from "@/lib/data";
import { createGroupAction } from "@/app/actions";

const TYPES = ["trip", "home", "couple", "apartment", "house", "other"];

export default function GroupsPage() {
  const me = currentUser();
  if (!me) redirect("/login");
  const groups = getGroupsForUser(me.id);
  const others = getUsers().filter((u) => u.id !== me.id);
  const addHref = groups.length === 1 ? `/groups/${groups[0].id}#add` : "/groups";

  return (
    <Shell user={me} active="groups" addHref={addHref}>
        <h1 className="mb-4 text-2xl font-bold text-ink">Groups</h1>

        {groups.length === 0 ? (
          <div className="card mb-6 text-sm text-muted">No groups yet — create one below.</div>
        ) : (
          <ul className="mb-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {groups.map((gr) => (
              <li key={gr.id}>
                <Link href={`/groups/${gr.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-bg">
                  <Avatar name={gr.name} size={38} />
                  <span className="font-semibold text-ink">{gr.name}</span>
                  <span className="ml-auto text-xs capitalize text-muted">{gr.groupType}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="card max-w-lg">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            New group
          </h2>
          <form action={createGroupAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Group name</label>
              <input id="name" name="name" required className="field" placeholder="e.g. Manali Trip" />
            </div>
            <div>
              <label className="label" htmlFor="groupType">Type</label>
              <select id="groupType" name="groupType" className="field">
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <fieldset>
              <legend className="label">Members</legend>
              <div className="space-y-1">
                {others.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" name="memberIds" value={u.id} defaultChecked />
                    {u.firstName} {u.lastName} <span className="text-muted">({u.email})</span>
                  </label>
                ))}
                <p className="pt-1 text-xs text-muted">You are added automatically.</p>
              </div>
            </fieldset>
            <button className="btn-coral" type="submit">Create group</button>
          </form>
        </div>
    </Shell>
  );
}
