import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require an authenticated user. Browsing/reading stays public;
// submitting, voting, commenting, and admin are gated.
// /submit is gated in-page with a friendly sign-in prompt rather than a hard
// 404, so it stays out of this list. APIs and admin hard-protect.
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/finds(.*)",
  "/api/votes(.*)",
  "/api/comments(.*)",
  "/api/flags(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files, but always run on API routes
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
