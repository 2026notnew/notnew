import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { setUserStatus, setUserRole } from "@/lib/actions";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata: Metadata = { title: "Accounts — NotNew" };

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  PAUSED: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  BANNED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { finds: true, comments: true } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
          ← Moderation
        </Link>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Accounts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {users.length} users · you can&apos;t change your own role or status.
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {users.map((u) => {
          const isSelf = u.id === admin.id;
          return (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  @{u.username}
                  {isSelf && (
                    <span className="ml-2 text-xs text-zinc-400">(you)</span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  {u.email} · {u._count.finds} finds · {u._count.comments}{" "}
                  comments
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[u.status]}`}
                >
                  {u.status}
                </span>
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {u.role}
                </span>

                {!isSelf && (
                  <>
                    {/* Status controls */}
                    {u.status !== "ACTIVE" && (
                      <form action={setUserStatus}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="status" value="ACTIVE" />
                        <button className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                          Reactivate
                        </button>
                      </form>
                    )}
                    {u.status !== "PAUSED" && (
                      <form action={setUserStatus}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="status" value="PAUSED" />
                        <button className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                          Pause
                        </button>
                      </form>
                    )}
                    {u.status !== "BANNED" && (
                      <form action={setUserStatus}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="status" value="BANNED" />
                        <ConfirmButton
                          message={`Ban @${u.username}? They will be blocked from submitting, voting, commenting, and flagging.`}
                          className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          Ban
                        </ConfirmButton>
                      </form>
                    )}

                    {/* Role control */}
                    {u.role !== "MODERATOR" ? (
                      <form action={setUserRole}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="role" value="MODERATOR" />
                        <button className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                          Make moderator
                        </button>
                      </form>
                    ) : (
                      <form action={setUserRole}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="role" value="USER" />
                        <button className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                          Remove moderator
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
