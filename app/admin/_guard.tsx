"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!supabase) { router.replace("/dashboard"); return; }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase!.from("profiles").select("role").eq("id", data.user.id).single();
      if (profile?.role !== "admin") { router.replace("/dashboard"); return; }
      setOk(true);
    });
  }, [router]);

  if (!ok) return (
    <div className="min-h-[300px] grid place-items-center font-mono-code text-[10px] tracking-widest text-[#4d7a9e]">
      MEMERIKSA AKSES ADMIN…
    </div>
  );
  return <>{children}</>;
}

export function AdminNav() {
  const pathname = usePathname();
  const links = [
    { href: "/admin/kepengurusan", label: "Kepengurusan" },
    { href: "/admin/final-projects", label: "Final Project" },
    { href: "/admin/pkm", label: "Verifikasi PKM" },
  ];
  return (
    <div className="flex gap-1 border-b border-[#2d4a63] mb-6">
      {links.map(l => (
        <Link key={l.href} href={l.href}
          className={`px-4 py-3 text-[12px] border-b-2 transition-colors font-medium ${
            pathname === l.href
              ? "text-[#29abe2] border-[#29abe2]"
              : "text-[#4d7a9e] border-transparent hover:text-[#b0c4d8]"
          }`}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}
