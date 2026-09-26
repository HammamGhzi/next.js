"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminRoot() {
  const router = useRouter();
  useEffect(() => {
    if (!supabase) { router.replace("/dashboard"); return; }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase!.from("profiles").select("role").eq("id", data.user.id).single();
      if (profile?.role === "admin") router.replace("/admin/kepengurusan");
      else router.replace("/dashboard");
    });
  }, [router]);
  return (
    <div className="min-h-screen grid place-items-center font-mono-code text-[10px] tracking-widest text-[#4d7a9e]">
      Memeriksa akses…
    </div>
  );
}
