import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-tally-path", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/dashboard/:path*", "/channels/:path*", "/points/:path*", "/votes/:path*", "/settings/:path*", "/billing/:path*", "/account/:path*", "/admin/:path*", "/success/:path*", "/failed/:path*"]
};
