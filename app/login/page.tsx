import { signInAction } from "@/app/actions";
import { getUsers } from "@/lib/data";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const users = getUsers();
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-4">
      <div className="w-full">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand text-lg font-bold text-white">
            SM
          </div>
          <h1 className="text-2xl font-bold text-ink">Welcome to SplitMate</h1>
          <p className="mt-1 text-sm text-muted">
            Split bills with friends and see who owes whom.
          </p>
        </div>

        <form action={signInAction} className="card space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="field"
              defaultValue="sagar@demo.in"
            />
          </div>
          {searchParams.error === "unknown" && (
            <p className="text-sm text-owe">
              No account with that email. Try a demo account below.
            </p>
          )}
          <button className="btn w-full" type="submit">Sign in</button>
          <button className="btn-ghost w-full" type="button" disabled>
            Continue with Google (coming soon)
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted">
          <p className="mb-2 font-semibold uppercase tracking-wide">Demo accounts</p>
          <div className="flex flex-wrap justify-center gap-2">
            {users.map((u) => (
              <code key={u.id} className="rounded bg-white px-2 py-1 text-ink shadow-sm">
                {u.email}
              </code>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
