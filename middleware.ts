import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/monthly-plan", "/my-debts", "/income-expenses", "/ai-insights"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get("accessToken")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  // Trust presence of token; verification happens in API routes using Node runtime.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/monthly-plan/:path*", "/my-debts/:path*", "/income-expenses/:path*", "/ai-insights/:path*"],
};
