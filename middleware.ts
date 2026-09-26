import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware ini sengaja dibiarkan pass-through.
 * 
 * Supabase JS v2 menyimpan session di localStorage (bukan cookie),
 * sehingga tidak bisa dicek di edge middleware.
 * Proteksi route dilakukan di client-side:
 * - /dashboard → cek di dashboard/page.tsx via supabase.auth.getUser()
 * - /admin     → cek di app/admin/_guard.tsx via AdminGuard
 * 
 * Untuk proteksi di edge, perlu migrasi ke @supabase/ssr.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
