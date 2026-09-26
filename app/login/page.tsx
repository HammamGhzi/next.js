"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageFrame, SupabaseNotice } from "@/app/components";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid."),
  password: z.string().min(8, "Minimal 8 karakter."),
});
const signupSchema = z.object({
  full_name: z.string().min(2, "Nama minimal 2 karakter."),
  nim: z.string().min(1, "NIM wajib diisi."),
  faculty: z.string().min(1, "Fakultas wajib diisi."),
  email: z.string().email("Email tidak valid."),
  password: z.string().min(8, "Minimal 8 karakter."),
});
type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="field-label">
      {label}
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

function LoginContent() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "";
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  async function handleLogin(v: LoginForm) {
    if (!supabase) { setMessage("Sambungkan Supabase dulu."); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
      if (error) throw error;
      router.push(nextPath);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }

  async function handleSignup(v: SignupForm) {
    if (!supabase) { setMessage("Sambungkan Supabase dulu."); return; }
    setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: v.email, password: v.password,
        options: { data: { full_name: v.full_name, nim: v.nim, faculty: v.faculty } },
      });
      if (error) throw error;
      if (data.user && !data.session) setMessage("Cek email untuk konfirmasi akun.");
      else router.push(nextPath);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Terjadi kesalahan."); }
    finally { setBusy(false); }
  }

  return (
    <div className="w-full max-w-[420px] relative z-10">
      <div className="card-navy p-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="brand-mark">
            <Image src="/images/forti-logo.jpg" alt="FoRTI" fill sizes="36px" className="object-cover" />
          </span>
          <div>
            <p className="font-display font-bold text-[16px] text-[#f0f6fc]">FoRTI</p>
            <p className="font-mono-code text-[9px] text-[#29abe2] tracking-[0.18em]">FORUM RISET TI</p>
          </div>
        </div>

        <h2 className="font-display font-bold text-[22px] text-[#f0f6fc] mb-1">
          {mode === "login" ? "Selamat datang" : "Buat akun"}
        </h2>
        <p className="text-[12px] text-[#7a9ab8] mb-6">
          {mode === "login" ? "Lanjutkan perjalanan belajarmu." : "Gunakan email kampus atau email aktif."}
        </p>

        {mode === "login" ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="grid gap-4">
            <Field label="Email" error={loginForm.formState.errors.email?.message}>
              <input {...loginForm.register("email")} type="email" placeholder="nama@email.com" className="field-input" />
            </Field>
            <Field label="Kata sandi" error={loginForm.formState.errors.password?.message}>
              <input {...loginForm.register("password")} type="password" placeholder="Minimal 8 karakter" className="field-input" />
            </Field>
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center mt-1 py-3 disabled:opacity-50 disabled:cursor-wait">
              {busy ? <><LoaderCircle size={14} className="animate-spin" /> Memproses…</> : <>Masuk <ArrowRight size={14} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={signupForm.handleSubmit(handleSignup)} className="grid gap-4">
            <Field label="Nama lengkap" error={signupForm.formState.errors.full_name?.message}>
              <input {...signupForm.register("full_name")} placeholder="Nama kamu" className="field-input" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="NIM" error={signupForm.formState.errors.nim?.message}>
                <input {...signupForm.register("nim")} placeholder="Nomor induk" className="field-input" />
              </Field>
              <Field label="Fakultas" error={signupForm.formState.errors.faculty?.message}>
                <input {...signupForm.register("faculty")} placeholder="Fakultas" className="field-input" />
              </Field>
            </div>
            <Field label="Email" error={signupForm.formState.errors.email?.message}>
              <input {...signupForm.register("email")} type="email" placeholder="nama@email.com" className="field-input" />
            </Field>
            <Field label="Kata sandi" error={signupForm.formState.errors.password?.message}>
              <input {...signupForm.register("password")} type="password" placeholder="Minimal 8 karakter" className="field-input" />
            </Field>
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center mt-1 py-3 disabled:opacity-50 disabled:cursor-wait">
              {busy ? <><LoaderCircle size={14} className="animate-spin" /> Memproses…</> : <>Daftar <ArrowRight size={14} /></>}
            </button>
          </form>
        )}

        {message && (
          <div className={`mt-4 rounded-md p-3 text-[12px] leading-[1.7] ${
            message.includes("berhasil") || message.includes("Cek")
              ? "bg-[#29abe215] border border-[#29abe230] text-[#29abe2]"
              : "bg-red-900/20 border border-red-500/20 text-red-400"
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}
          className="block mx-auto mt-5 bg-transparent border-0 text-[#4d7a9e] text-[12px] hover:text-[#29abe2] transition-colors"
        >
          {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </div>

      <div className="mt-4">
        <SupabaseNotice />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PageFrame>
      <div className="min-h-[calc(100vh-72px)] grid place-items-center px-5 py-16 bg-[#1e3040]">
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#29abe2] opacity-[0.04] blur-[80px] pointer-events-none" />
        <Suspense fallback={null}>
          <LoginContent />
        </Suspense>
      </div>
    </PageFrame>
  );
}
