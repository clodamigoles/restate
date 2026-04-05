import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { jwtVerify } from 'jose';

const protectedRoutes = ['/account', '/bookings'];
const adminRoutes = ['/dlt'];
const authRoutes = ['/auth/login', '/auth/register'];

async function verifyAdminCookie(request) {
  const cookie = request.cookies.get('admin-token');
  if (!cookie?.value) return false;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');
    await jwtVerify(cookie.value, secret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Admin routes — code d'acces via cookie
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    // Allow access to login page
    if (pathname === '/dlt/login') {
      const isAdmin = await verifyAdminCookie(request);
      if (isAdmin) {
        return NextResponse.redirect(new URL('/dlt', request.url));
      }
      return NextResponse.next();
    }

    const isAdmin = await verifyAdminCookie(request);
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dlt/login', request.url));
    }
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Redirige les users connectés loin des pages auth
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Routes protégées — login requis
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/bookings/:path*', '/dlt/:path*', '/auth/:path*'],
};
