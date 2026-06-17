import type { Availability } from "@prisma/client";

export type EffectiveAvailability = Availability;

/**
 * A find is EXPIRED once it's past its expiresAt date, even if no one has
 * marked it so. An explicit SOLD/EXPIRED status always wins.
 */
export function effectiveAvailability(find: {
  availability: Availability;
  expiresAt: Date | null;
}): EffectiveAvailability {
  if (find.availability !== "AVAILABLE") return find.availability;
  if (find.expiresAt && find.expiresAt.getTime() < Date.now()) return "EXPIRED";
  return "AVAILABLE";
}

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  AVAILABLE: "Available",
  SOLD: "Too Late",
  EXPIRED: "No longer available",
};
