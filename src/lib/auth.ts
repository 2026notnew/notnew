import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/**
 * Returns the NotNew User row for the signed-in Clerk user, creating it on
 * first sight. Returns null when no one is signed in.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses[0]?.emailAddress ?? `${userId}@placeholder.notnew`;
  const baseUsername =
    clerkUser.username ??
    email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") ??
    "collector";

  // Ensure username uniqueness with a short suffix if needed.
  let username = baseUsername;
  for (let i = 0; i < 5; i++) {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (!taken) break;
    username = `${baseUsername}${Math.floor(Math.random() * 9000) + 1000}`;
  }

  return prisma.user.create({
    data: { clerkId: userId, email, username },
  });
}
