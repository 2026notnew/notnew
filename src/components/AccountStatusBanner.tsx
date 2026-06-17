import { getCurrentUser } from "@/lib/auth";

export async function AccountStatusBanner() {
  const user = await getCurrentUser();
  if (!user || user.status === "ACTIVE") return null;

  const paused = user.status === "PAUSED";

  return (
    <div
      className={`px-4 py-2 text-center text-sm ${
        paused
          ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
      }`}
    >
      {paused ? (
        <>
          Your account is <strong>paused</strong>. You can browse, but
          submitting, voting, commenting, and flagging are disabled.
        </>
      ) : (
        <>
          Your account is <strong>suspended</strong>. You can browse, but you
          can no longer contribute.
        </>
      )}{" "}
      Questions? Contact{" "}
      <a href="mailto:support@notnew.com" className="underline">
        support@notnew.com
      </a>
      .
    </div>
  );
}
