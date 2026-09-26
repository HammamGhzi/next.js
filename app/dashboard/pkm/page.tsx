"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { PageFrame, PageIntro, SupabaseNotice } from "@/app/components";
import { isSupabaseConfigured, PkmSubmission, statusLabel, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const SCHEMES = ["PKM-KC", "PKM-RE", "PKM-RSH", "PKM-PM", "PKM-PI", "PKM-K", "PKM-VGK", "PKM-AI", "PKM-GFT", "PKM-KI"];

const schema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter."),
  scheme: z.string().min(1),
  abstract: z.string().min(80, "Abstrak minimal 80 karakter."),
  supervisor_name: z.string().min(3, "Masukkan nama dosen pendamping."),
  drive_proposal_url: z
    .string()
    .url("Masukkan URL yang valid.")
    .refine(v => v.includes("drive.google.com") || v.includes("docs.google.com"), "Tautan harus dari Google Drive."),
});
type FormData = z.infer<typeof schema>;

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="field-label">{label}</span>
      {hint && <span className="text-[9px] text-[#4d7a9e]">{hint}</span>}
      {children}
      {error && <span className="text-[9px] text-red-400">{error}</span>}
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted:    "bg-[#29abe215] border border-[#29abe230] text-[#29abe2]",
    published:    "bg-[#29abe215] border border-[#29abe230] text-[#29abe2]",
    rejected:     "bg-red-900/20 border border-red-500/20 text-red-400",
    under_review: "bg-yellow-900/20 border border-yellow-500/20 text-yellow-400",
    verified:     "bg-[#29abe215] border border-[#29abe230] text-[#29abe2]",
  };
  return (
    <span className={`mono-label text-[9px] tracking-wide px-2 py-1 rounded-full ${map[status] ?? "bg-yellow-900/20 border border-yellow-500/20 text-yellow-400"}`}>
      {statusLabel(status as any)}
    </span>
  );
}

export default function PkmSubmitPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [myPkms, setMyPkms] = useState<PkmSubmission[]>([]);
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", scheme: "PKM-KC", abstract: "", supervisor_name: "", drive_proposal_url: "" },
  });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      const uid = data.user.id;
      setUserId(uid);
      // Find team
      const { data: ownTeam } = await supabase!.from("teams").select("id").eq("leader_id", uid).maybeSingle();
      if (ownTeam) setTeamId(ownTeam.id);
      else {
        const { data: mem } = await supabase!.from("team_members").select("team_id").eq("profile_id", uid).maybeSingle();
        if (mem) setTeamId(mem.team_id);
      }
      // My submissions
      const { data: pkms } = await supabase!.from("pkm_submissions").select("*").eq("submitted_by", uid).order("submitted_at", { ascending: false });
      setMyPkms((pkms ?? []) as PkmSubmission[]);
    });
  }, [router]);

  async function onSubmit(values: FormData) {
    if (!supabase) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("pkm_submissions").insert({
        submitted_by: userId,
        team_id: teamId,
        scheme: values.scheme,
        title: values.title,
        abstract: values.abstract,
        supervisor_name: values.supervisor_name,
        drive_proposal_url: values.drive_proposal_url,
        status: "submitted",
      });
      if (error) throw error;
      reset();
      toast({ title: "Karya PKM berhasil diarsipkan!", description: "Admin akan memverifikasi sebelum dipublikasikan.", variant: "success" as any });
      // Refresh list
      const { data: pkms } = await supabase.from("pkm_submissions").select("*").eq("submitted_by", userId).order("submitted_at", { ascending: false });
      setMyPkms((pkms ?? []) as PkmSubmission[]);
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal menyimpan karya PKM.", variant: "error" as any });
    } finally { setBusy(false); }
  }

  return (
    <PageFrame>
      <PageIntro
        number="03"
        label="ARSIP PKM"
        title={<>Simpan karya<br /><em className="not-italic text-[#29abe2]">PKM-mu.</em></>}
        description="Arsipkan proposal PKM final dengan tautan Google Drive. Dokumen tetap di Drive-mu, bebas biaya storage."
      />

      <section className="px-[6%] py-16 bg-[#111e2a]">
        <SupabaseNotice />
        {!isSupabaseConfigured ? null : (
          <div className="max-w-[700px]">
            <form onSubmit={handleSubmit(onSubmit)} className="card-navy p-6 grid gap-4">
              <div>
                <h2 className="font-display font-medium text-[23px] tracking-[-0.7px] mt-0 mb-1 text-[#f0f6fc]">Arsip Karya PKM Final</h2>
                <p className="text-[11px] text-[#7a9ab8] leading-[1.7]">
                  Dokumen tetap di Google Drive. Pastikan izin tautan Drive diatur ke <strong className="text-[#f0f6fc]">Viewer</strong>.
                </p>
              </div>

              <Field label="Judul karya" error={errors.title?.message}>
                <input {...register("title")} placeholder="Judul karya PKM"
                  className="field-input" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Skema PKM" error={errors.scheme?.message}>
                  <select {...register("scheme")} className="field-input">
                    {SCHEMES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Dosen pendamping" error={errors.supervisor_name?.message}>
                  <input {...register("supervisor_name")} placeholder="Nama dosen (tanpa gelar)"
                    className="field-input" />
                </Field>
              </div>

              <Field label="Abstrak / ringkasan ide" hint="Minimal 80 karakter" error={errors.abstract?.message}>
                <textarea rows={6} {...register("abstract")} placeholder="Jelaskan masalah, gagasan solusi, dan dampak yang diharapkan…"
                  className="field-input resize-vertical leading-relaxed" />
              </Field>

              <Field label="Tautan dokumen final Google Drive" hint="Atur izin ke 'Siapa saja yang punya tautan dapat melihat'" error={errors.drive_proposal_url?.message}>
                <input {...register("drive_proposal_url")} placeholder="https://drive.google.com/…"
                  className="field-input" />
              </Field>

              <button type="submit" disabled={busy}
                className="btn-primary w-full justify-center py-3 mt-2 flex items-center gap-3 text-[12px] font-semibold disabled:opacity-60 disabled:cursor-wait">
                {busy ? <><LoaderCircle size={14} className="animate-spin" /> Menyimpan…</> : <>Arsipkan untuk verifikasi <ArrowRight size={14} /></>}
              </button>
            </form>

            {/* My PKMs */}
            {myPkms.length > 0 && (
              <div className="mt-9">
                <div className="flex items-center gap-[9px] mono-label text-[10px] tracking-[1.1px] text-[#7a9ab8] mb-3 pb-3 border-b border-[#2d4a63]">
                  <span className="text-[#29abe2]">STATUS</span> / PKM SAYA
                </div>
                {myPkms.map(p => (
                  <div key={p.id} className="flex justify-between items-center gap-4 py-4 border-b border-[#2d4a63]">
                    <div className="grid gap-1.5">
                      <span className="mono-label text-[9px] text-[#7a9ab8]">{p.scheme}</span>
                      <strong className="font-display font-medium text-[13px] text-[#f0f6fc]">{p.title}</strong>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </PageFrame>
  );
}
