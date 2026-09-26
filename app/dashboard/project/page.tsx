"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ImagePlus, LoaderCircle } from "lucide-react";
import { PageFrame, PageIntro, SupabaseNotice } from "@/app/components";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { compressProjectCover } from "@/lib/images";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter."),
  tagline: z.string().min(5, "Tagline minimal 5 karakter."),
  category: z.string().min(1),
  tech_stack: z.string().min(2, "Tulis minimal satu teknologi."),
  description: z.string().min(20, "Deskripsi minimal 20 karakter."),
  demo_url: z.string().url("Masukkan URL demo yang valid."),
  repo_url: z.union([z.literal(""), z.string().url("URL repositori tidak valid.")]),
});
type FormData = z.infer<typeof schema>;

const CATEGORIES = ["Web App", "Mobile App", "Data & AI", "IoT", "Game", "UI/UX", "Lainnya"];

const artColor = (cat: string) => {
  if (["Web App", "UI/UX"].includes(cat)) return "bg-[#1a3040]";
  if (["Mobile App", "IoT"].includes(cat)) return "bg-[#1a2a3a]";
  if (["Data & AI", "Game"].includes(cat)) return "bg-[#1e2a40]";
  return "bg-[#1a3040]";
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="text-[9px] text-red-400">{error}</span>}
    </label>
  );
}

export default function ProjectSubmitPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", tagline: "", category: "Web App", tech_stack: "", description: "", demo_url: "", repo_url: "" },
  });

  const title = watch("title");
  const tagline = watch("tagline");
  const category = watch("category");
  const techStack = watch("tech_stack");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      setUserId(data.user.id);
      // Find team
      const { data: ownTeam } = await supabase!.from("teams").select("id").eq("leader_id", data.user.id).maybeSingle();
      if (ownTeam) { setTeamId(ownTeam.id); return; }
      const { data: mem } = await supabase!.from("team_members").select("team_id").eq("profile_id", data.user.id).maybeSingle();
      if (mem) setTeamId(mem.team_id);
    });
  }, [router]);

  async function onSubmit(values: FormData) {
    if (!supabase) return;
    setBusy(true);
    try {
      let thumbnail_url: string | null = null;
      const input = document.getElementById("project-image") as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (file) {
        const compressed = await compressProjectCover(file);
        const path = `${userId}/${Date.now()}-${compressed.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
        const { error: uploadError } = await supabase.storage.from("project-assets").upload(path, compressed, { upsert: true, contentType: compressed.type });
        if (uploadError) throw uploadError;
        thumbnail_url = supabase.storage.from("project-assets").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("final_projects").insert({
        submitted_by: userId,
        team_id: teamId,
        title: values.title,
        tagline: values.tagline,
        category: values.category,
        description: values.description,
        tech_stack: values.tech_stack.split(",").map(s => s.trim()).filter(Boolean),
        demo_url: values.demo_url,
        repo_url: values.repo_url || null,
        thumbnail_url,
        status: "pending",
      });
      if (error) throw error;
      reset(); if (input) input.value = ""; setThumbPreview(null);
      toast({ title: "Proyek berhasil dikirim!", description: "Menunggu kurasi admin sebelum tampil publik.", variant: "success" as any });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Proyek gagal disimpan.", variant: "error" as any });
    } finally { setBusy(false); }
  }

  return (
    <PageFrame>
      <PageIntro
        number="02"
        label="KIRIM KARYA"
        title={<>Upload final<br /><em className="not-italic text-[#29abe2]">project-mu.</em></>}
        description="Isi detail proyekmu, lihat live preview kartu portfolio, lalu kirim untuk dikurasi admin."
      />

      <section className="px-[6%] py-16 bg-[#111e2a]">
        <SupabaseNotice />
        {!isSupabaseConfigured ? null : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-9 items-start">
            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="card-navy p-6 grid gap-4">
              <div>
                <h2 className="font-display font-medium text-[23px] tracking-[-0.7px] mt-0 mb-1 text-[#f0f6fc]">Kirim Final Project</h2>
                <p className="text-[11px] text-[#7a9ab8] leading-[1.7]">Karya akan berstatus pending sampai admin selesai mengkurasi.</p>
              </div>

              <Field label="Judul proyek" error={errors.title?.message}>
                <input {...register("title")} placeholder="Contoh: Ruang Tumbuh"
                  className="field-input" />
              </Field>

              <Field label="Tagline" error={errors.tagline?.message}>
                <input {...register("tagline")} placeholder="Satu kalimat tentang proyekmu"
                  className="field-input" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Kategori" error={errors.category?.message}>
                  <select {...register("category")} className="field-input">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Tech stack (pisahkan koma)" error={errors.tech_stack?.message}>
                  <input {...register("tech_stack")} placeholder="Next.js, Supabase"
                    className="field-input" />
                </Field>
              </div>

              <Field label="Deskripsi" error={errors.description?.message}>
                <textarea rows={4} {...register("description")} placeholder="Masalah yang diselesaikan dan cara kerjanya…"
                  className="field-input resize-vertical leading-relaxed" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="URL demo (wajib)" error={errors.demo_url?.message}>
                  <input {...register("demo_url")} placeholder="https://…"
                    className="field-input" />
                </Field>
                <Field label="URL repositori (opsional)" error={errors.repo_url?.message}>
                  <input {...register("repo_url")} placeholder="https://github.com/…"
                    className="field-input" />
                </Field>
              </div>

              <Field label="Thumbnail 16:9 (opsional)">
                <label htmlFor="project-image" className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#2d4a63] p-4 text-[10px] text-[#7a9ab8] hover:border-[#29abe2] transition-colors">
                  <ImagePlus size={16} />
                  {thumbPreview ? "Gambar dipilih, klik untuk ganti" : "Pilih gambar, dikompres otomatis (16:9 WebP)"}
                  <input id="project-image" type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setThumbPreview(URL.createObjectURL(f)); }} />
                </label>
                {thumbPreview && <img src={thumbPreview} alt="preview" className="mt-2 w-full aspect-video object-cover rounded-lg" />}
              </Field>

              <button type="submit" disabled={busy}
                className="btn-primary w-full justify-center py-3 mt-2 flex items-center gap-3 text-[12px] font-semibold disabled:opacity-60 disabled:cursor-wait">
                {busy ? <><LoaderCircle size={14} className="animate-spin" /> Mengirim…</> : <>Kirim untuk kurasi <ArrowRight size={14} /></>}
              </button>
            </form>

            {/* Live Preview */}
            <div className="sticky top-6 bg-[#243649] border border-[#2d4a63] rounded-lg p-5">
              <span className="mono-label text-[9px] tracking-[1.1px] text-[#7a9ab8] block mb-3">LIVE PREVIEW</span>
              <div className={`relative h-[200px] overflow-hidden rounded-lg grid place-items-center ${artColor(category)}`}>
                {thumbPreview ? (
                  <img src={thumbPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="absolute top-[12px] left-[12px] mono-label text-[8px] tracking-[1.1px] text-[#4d7a9e]">FORTI PROJECT / PREVIEW</span>
                    <span className="font-display text-[80px] text-[#29abe2]/20 rotate-[-10deg] select-none">✳</span>
                    <span className="absolute right-[12px] bottom-[12px] mono-label text-[8px] tracking-[1.1px] text-[#4d7a9e]">{category || "Kategori"}</span>
                  </>
                )}
              </div>
              <div className="mt-4">
                <span className="mono-label text-[9px] text-[#7a9ab8]">{techStack || "Tech stack"}</span>
                <h3 className="font-display font-medium text-[20px] tracking-[-0.5px] mt-1.5 mb-0 text-[#f0f6fc]">{title || "Judul proyekmu"}</h3>
                <p className="text-[11px] text-[#7a9ab8] mt-2 leading-[1.7]">{tagline || "Tagline singkat akan terlihat di sini."}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2d4a63] text-[10px] text-[#4d7a9e] leading-[1.7]">
                ✳ Pastikan demo dapat dibuka publik dan repositori tidak berisi kredensial rahasia.
              </div>
            </div>
          </div>
        )}
      </section>
    </PageFrame>
  );
}
