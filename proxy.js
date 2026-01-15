import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/admin"];

// Routes that require HR or Admin role
const hrAdminRoutes = [
  "/admin/jobs",
  "/admin/candidates",
  "/admin/dashboard",
  "/admin/settings",
];

// API routes that require authentication
const protectedApiRoutes = [
  "/api/jobs", // POST, PUT, DELETE (GET is public)
  "/api/applications", // Except token-based access
  "/api/tests/generate",
  "/api/tests/invite",
  "/api/interview/invite",
];

// Next.js 16: Function name changed from 'middleware' to 'proxy'
export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if it's an HR/Admin route
  const isHrAdminRoute = hrAdminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if it's a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // For API routes, check the method as well
  const method = request.method;

  // Special handling for /api/jobs - GET is public, others require auth
  if (pathname.startsWith("/api/jobs") && !pathname.includes("/apply")) {
    if (method !== "GET" && !token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  }

  // Special handling for /api/applications - token query param allows public access
  if (pathname.startsWith("/api/applications")) {
    const url = new URL(request.url);
    const hasToken =
      url.searchParams.has("token") ||
      url.searchParams.has("interview_token") ||
      url.searchParams.has("test_token") ||
      url.searchParams.has("testToken");

    // Allow public access if using token-based access
    if (hasToken) {
      return NextResponse.next();
    }

    // Otherwise require auth
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  }

  // Protected page routes - redirect to sign in
  if (isProtectedRoute && !token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // HR/Admin routes - check role
  if (isHrAdminRoute && token) {
    const userRole = token.role;
    if (!["hr", "admin"].includes(userRole)) {
      // Redirect to unauthorized page or home
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Protected API routes (except special cases handled above)
  if (isProtectedApiRoute && !token) {
    // Skip if already handled (jobs, applications)
    if (
      !pathname.startsWith("/api/jobs") &&
      !pathname.startsWith("/api/applications")
    ) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  }

  // Check role for protected API routes
  if (isProtectedApiRoute && token) {
    const userRole = token.role;
    // Tests and interview invite endpoints require HR or Admin
    if (
      (pathname.startsWith("/api/tests/generate") ||
        pathname.startsWith("/api/tests/invite") ||
        pathname.startsWith("/api/interview/invite")) &&
      !["hr", "admin"].includes(userRole)
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
