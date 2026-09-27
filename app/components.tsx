"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, LogOut, Menu, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/* ─────────────────────────────────────────────
   SiteHeader
───────────────────────────────────────────── */
export function SiteHeader() {
  const [user, setUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const update = async () => {
      const { data } = await supabase!.auth.getUser();
      setUser(data.user?.email ?? null);
      if (data.user) {
        const { data: profile } = await supabase!
          .from("profiles").select("role").eq("id", data.user.id).maybeSingle();
        setIsAdmin(profile?.role === "admin");
      } else setIsAdmin(false);
    };
    update();
    const { data: listener } = supabase.auth.onAuthStateChange(() => update());
    return () => listener.subscription.unsubscribe();
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pengurus", label: "Pengurus" },
    { href: "/showcase", label: "Showcase" },
    { href: "/pkm", label: "Katalog PKM" },
  ];

  return (
    <header
      className={`nav-bar ${scrolled ? "scrolled" : ""}`}
      style={{ background: scrolled ? undefined : "transparent" }}
    >
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 group">
        <span className="brand-mark">
          <Image src="/images/forti-logo.jpg" alt="Logo FORTI" fill sizes="36px" className="object-cover" />
        </span>
        <span className="font-display font-bold text-[17px] tracking-tight text-[#f0f6fc]">
          FoRTI
          <span className="block font-mono-code text-[8px] font-normal tracking-[0.18em] text-[#29abe2] mt-[1px]">
            FORUM RISET TI
          </span>
        </span>
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-8">
        {navLinks.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="text-[13px] text-[#b0c4d8] hover:text-[#29abe2] transition-colors font-medium"
          >
            {l.label}
          </Link>
        ))}
        {isAdmin && (
          <Link href="/admin" className="text-[13px] text-[#b0c4d8] hover:text-[#29abe2] transition-colors font-medium">
            Admin
          </Link>
        )}
      </nav>

      {/* CTA */}
      <Link
        href={user ? "/dashboard" : "/login"}
        className="hidden md:flex btn-primary text-[12px] px-4 py-2.5"
      >
        {user ? "Dashboard" : "Masuk"} <ArrowRight size={14} />
      </Link>

      {/* Mobile hamburger */}
      <button
        className="md:hidden text-[#b0c4d8] hover:text-[#29abe2] transition-colors p-1"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-[72px] left-0 right-0 bg-[#111e2a]/95 backdrop-blur-md border-b border-[#2d4a63] px-[6%] py-5 flex flex-col gap-4 z-50">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-[13px] text-[#b0c4d8] hover:text-[#29abe2] transition-colors"
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="text-[13px] text-[#b0c4d8] hover:text-[#29abe2]">
              Admin
            </Link>
          )}
          <Link
            href={user ? "/dashboard" : "/login"}
            onClick={() => setOpen(false)}
            className="btn-primary w-fit text-[12px]"
          >
            {user ? "Dashboard" : "Masuk"} <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </header>
  );
}

/* ─────────────────────────────────────────────
   PageFrame
───────────────────────────────────────────── */
export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1e3040] text-[#f0f6fc]">
      <SiteHeader />
      <AuthStatus />
      {children}
      <footer className="border-t border-[#2d4a63] bg-[#111e2a]">
        <div className="px-[6%] py-8 flex flex-col items-center gap-5 md:flex-row md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="brand-mark">
              <Image src="/images/forti-logo.jpg" alt="" fill sizes="36px" className="object-cover" />
            </span>
            <span className="font-display font-bold text-[15px] text-[#f0f6fc]">
              FoRTI
              <span className="block font-mono-code text-[8px] font-normal tracking-[0.18em] text-[#29abe2]">
                FORUM RISET TI
              </span>
            </span>
          </Link>
          <div className="w-16 h-px bg-[#2d4a63] md:hidden" />
          <div className="flex items-center gap-5">
            <span className="font-mono-code text-[9px] text-[#2d4a63]">© 2026 FoRTI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PageIntro
───────────────────────────────────────────── */
export function PageIntro({
  number,
  label,
  title,
  description,
}: {
  number?: string;
  label?: string;
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <section className="page-intro">
      <div className="grid-bg opacity-30" />
      <div className="relative z-10 max-w-3xl">
        {(number || label) && (
          <div className="mono-label mb-5 flex items-center gap-3">
            {number && <span className="text-[#2d4a63]">{number}</span>}
            {number && label && <span className="w-6 h-px bg-[#29abe2]" />}
            {label && <span>{label}</span>}
          </div>
        )}
        <h1 className="h-section text-[clamp(32px,5.5vw,68px)] text-[#f0f6fc] mb-4 font-display">
          {title}
        </h1>
        {description && (
          <p className="text-[14px] leading-[1.8] text-[#7a9ab8] max-w-[500px]">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   AuthStatus
───────────────────────────────────────────── */
export function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);
  if (!email) return null;
  return (
    <div className="flex items-center justify-between bg-[#111e2a] border-b border-[#2d4a63] px-[6%] py-2.5 text-[11px] text-[#7a9ab8] gap-3">
      <span className="truncate min-w-0">Masuk sebagai <span className="text-[#29abe2]">{email}</span></span>
      <button
        onClick={async () => { await supabase?.auth.signOut(); location.href = "/"; }}
        className="flex items-center gap-1.5 text-[#4d7a9e] hover:text-[#29abe2] transition-colors shrink-0"
      >
        <LogOut size={12} /> Keluar
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SupabaseNotice
───────────────────────────────────────────── */
export function SupabaseNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="mb-5 rounded-lg border border-[#29abe230] bg-[#29abe210] p-4 text-[12px] leading-[1.7] text-[#b0c4d8]">
      <strong className="text-[#29abe2]">Supabase belum dikonfigurasi.</strong>{" "}
      Tambahkan URL dan anon key di{" "}
      <code className="font-mono-code text-[10px] bg-[#29abe220] px-1.5 py-0.5 rounded">.env.local</code>,
      lalu jalankan{" "}
      <code className="font-mono-code text-[10px] bg-[#29abe220] px-1.5 py-0.5 rounded">supabase/schema.sql</code>.
    </div>
  );
}
