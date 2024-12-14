import { NextResponse } from "next/server";
import { getToken } from "@/lib/axios";

export async function middleware(request) {
  const accessToken = await getToken("accessToken");
  const path = request.nextUrl.pathname;

  // Public routes that don't need authentication
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/emailVerification'
  ];

  // Protected routes that need authentication
  const protectedRoutes = [
    '/dashboard',
    '/settings',
    '/generator',
    '/subscription'
  ];

  if (protectedRoutes.some(route => path.startsWith(route))) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (publicRoutes.includes(path) && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/generator/:path*',
    '/subscription/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/emailVerification'
  ],
};
