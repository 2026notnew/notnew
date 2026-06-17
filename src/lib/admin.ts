import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { User } from "@prisma/client";

/**
 * Returns the current user if they are a MODERATOR or ADMIN, otherwise
 * triggers a 404 (we hide the admin surface rather than advertise it).
 */
export async function requireStaff(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    notFound();
  }
  return user;
}

export async function isStaff(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && (user.role === "ADMIN" || user.role === "MODERATOR");
}
