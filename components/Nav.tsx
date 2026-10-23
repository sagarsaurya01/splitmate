import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { User } from "@/lib/data";

export default function Nav({ user }: { user: User }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
            SM
          </span>
          <span className="text-lg font-bold text-ink">SplitMate</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-muted">
          <Link href="/dashboard" className="hover:text-ink">Balances</Link>
          <Link href="/groups" className="hover:text-ink">Groups</Link>
          <span className="hidden text-ink sm:inline">
            {user.firstName}
          </span>
          <form action={signOutAction}>
            <button className="text-muted hover:text-ink" type="submit">
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
