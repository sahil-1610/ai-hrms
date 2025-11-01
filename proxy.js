import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Middleware to protect HR/Admin routes
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Protect all /admin routes - require HR or admin role
    if (pathname.startsWith("/admin")) {
      if (!token || (token.role !== "hr" && token.role !== "admin")) {
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect these routes with authentication
export const config = {
  matcher: [
    "/admin/:path*", // All admin routes require auth
  ],
};
