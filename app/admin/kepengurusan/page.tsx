"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import imageCompression from "browser-image-compression";
import { Check, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { PageFrame, PageIntro, SupabaseNotice } from "@/app/components";
import { AdminGuard, AdminNav } from "@/app/admin/_guard";
import { isSupabaseConfigured, OrganizationMember, Period, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

/* ─── Zod schemas ─── */
const periodSchema = z.object({
  cabinet_name: z.string().min(3, "Nama kabinet minimal 3 karakter"),
  year_start: z.coerce.number().min(2000, "Tahun tidak valid").max(2100, "Tahun tidak valid"),
  year_end: z.coerce.number().min(2000, "Tahun tidak valid").max(2100, "Tahun tidak valid"),
}).refine(d => d.year_end >= d.year_start, {
  message: "Tahun akhir harus ≥ tahun mulai",
  path: ["year_end"],
});

const memberSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  role_position: z.string().min(2, "Jabatan minimal 2 karakter"),
  department: z.string().optional(),
  linkedin_url: z.string().url("URL LinkedIn tidak valid").or(z.literal("")).optional(),
  instagram_url: z.string().url("URL Instagram tidak valid").or(z.literal("")).optional(),
});

type PeriodForm = z.infer<typeof periodSchema>;
type MemberForm = z.infer<typeof memberSchema>;

/* ─── Auto order berdasarkan role ─── */
function autoOrder(role: string, dept: string, existingMembers: OrganizationMember[]): number {
  const r = role.toLowerCase();
  const isKetua = (r.includes("ketua") || r.includes("kepala")) && !r.includes("wakil") && !r.includes("koordinator");
  const isWakil = r.includes("wakil");
  const isKoord = r.includes("koordinator") || r.includes("koord");
  if (isKetua) return 1;
  if (isWakil) return 2;
  if (isKoord) {
    const koords = existingMembers.filter(m => {
      const mr = m.role_position.toLowerCase();
      return mr.includes("koordinator") || mr.includes("koord");
    });
    const sameDept = koords.find(m => m.department === dept);
    if (sameDept) return sameDept.display_order;
    return 10 + koords.length;
  }
  const divisiKoord = existingMembers.find(m => {
    const mr = m.role_position.toLowerCase();
    return (mr.includes("koordinator") || mr.includes("koord")) && m.department === dept;
  });
  const baseOrder = divisiKoord ? divisiKoord.display_order * 10 : 100;
  const divisiAnggota = existingMembers.filter(m => {
    const mr = m.role_position.toLowerCase();
    return !mr.includes("ketua") && !mr.includes("kepala") && !mr.includes("wakil") &&
           !mr.includes("koordinator") && !mr.includes("koord") && m.department === dept;
  });
  return baseOrder + divisiAnggota.length + 1;
}

/* ─── Field error helper ─── */
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="field-error">{msg}</p>;
}

/* ─── Edit Period Modal ─── */
function EditPeriodModal({ period, onClose, onSave }: {
  period: Period; onClose: () => void; onSave: (p: Period) => void;
}) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PeriodForm>({
    resolver: zodResolver(periodSchema),
    defaultValues: { cabinet_name: period.cabinet_name, year_start: period.year_start, year_end: period.year_end },
  });

  async function onValid(data: PeriodForm) {
    if (!supabase) return;
    try {
      const { error } = await supabase.from("periods")
        .update({ cabinet_name: data.cabinet_name, year_start: data.year_start, year_end: data.year_end })
        .eq("id", period.id);
      if (error) throw error;
      onSave({ ...period, ...data });
      toast({ title: "Periode berhasil diperbarui!", variant: "success" as any });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal memperbarui.", variant: "error" as any });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="card-navy p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-[18px] text-[#f0f6fc]">Edit Periode</h3>
          <button onClick={onClose} className="text-[#4d7a9e] hover:text-[#f0f6fc] transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onValid)} className="grid gap-3">
          <div className="grid gap-1.5">
            <input {...register("cabinet_name")} placeholder="Nama kabinet" className="field-input" />
            <FieldError msg={errors.cabinet_name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <span className="field-label">Tahun mulai</span>
              <input type="number" {...register("year_start")} onFocus={e => e.target.select()} className="field-input" />
              <FieldError msg={errors.year_start?.message} />
            </div>
            <div className="grid gap-1.5">
              <span className="field-label">Tahun akhir</span>
              <input type="number" {...register("year_end")} onFocus={e => e.target.select()} className="field-input" />
              <FieldError msg={errors.year_end?.message} />
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center disabled:opacity-60">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Edit Member Modal ─── */
function EditMemberModal({ member, allMembers, onClose, onSave }: {
  member: OrganizationMember; allMembers: OrganizationMember[];
  onClose: () => void; onSave: (m: OrganizationMember) => void;
}) {
  const { toast } = useToast();
  const [photoName, setPhotoName] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: member.name, role_position: member.role_position,
      department: member.department ?? "",
      linkedin_url: member.linkedin_url ?? "", instagram_url: member.instagram_url ?? "",
    },
  });

  async function onValid(data: MemberForm) {
    if (!supabase) return;
    try {
      let photo_url = member.photo_url;
      const file = (document.getElementById("edit-member-photo") as HTMLInputElement)?.files?.[0];
      if (file) {
        const compressed = await imageCompression(file, { maxSizeMB: 0.15, maxWidthOrHeight: 1100, useWebWorker: true });
        const path = `${member.period_id}/${Date.now()}-${compressed.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
        const { error: uploadErr } = await supabase.storage.from("organization-photos").upload(path, compressed, { upsert: true, contentType: compressed.type });
        if (uploadErr) throw uploadErr;
        photo_url = supabase.storage.from("organization-photos").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("organization_members").update({
        name: data.name, role_position: data.role_position,
        department: data.department || null,
        display_order: autoOrder(data.role_position, data.department ?? "", allMembers.filter(m => m.id !== member.id)),
        linkedin_url: data.linkedin_url || null,
        instagram_url: data.instagram_url || null,
        photo_url,
      }).eq("id", member.id);
      if (error) throw error;
      onSave({ ...member, ...data, photo_url });
      toast({ title: "Pengurus berhasil diperbarui!", variant: "success" as any });
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Gagal memperbarui.", variant: "error" as any });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="card-navy p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-[18px] text-[#f0f6fc]">Edit Pengurus</h3>
          <button onClick={onClose} className="text-[#4d7a9e] hover:text-[#f0f6fc] transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onValid)} className="grid gap-3">
          <div className="grid gap-1.5">
            <input {...register("name")} placeholder="Nama lengkap" className="field-input" />
            <FieldError msg={errors.name?.message} />
          </div>
          <div className="grid gap-1.5">
            <input {...register("role_position")} placeholder="Jabatan" className="field-input" />
            <FieldError msg={errors.role_position?.message} />
          </div>
          <input {...register("department")} placeholder="Divisi (opsional)" className="field-input" />
          <div className="grid gap-1.5">
            <input {...register("linkedin_url")} placeholder="URL LinkedIn (opsional)" className="field-input" />
            <FieldError msg={errors.linkedin_url?.message} />
          </div>
          <div className="grid gap-1.5">
            <input {...register("instagram_url")} placeholder="URL Instagram (opsional)" className="field-input" />
            <FieldError msg={errors.instagram_url?.message} />
          </div>
          <label htmlFor="edit-member-photo" className="flex cursor-pointer items-center gap-2 border border-dashed border-[#2d4a63] p-3 hover:border-[#29abe2] transition-colors rounded-lg">
            <Upload size={13} className="text-[#4d7a9e] shrink-0" />
            <span className="text-[10px] text-[#7a9ab8] hover:text-[#29abe2] transition-colors truncate">
              {photoName || "Foto pengurus"}
            </span>
            <input id="edit-member-photo" type="file" accept="image/*" className="hidden"
              onChange={e => setPhotoName(e.target.files?.[0]?.name ?? "")} />
          </label>
          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Batal</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center disabled:opacity-60">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminKepengurusanPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const { toast } = useToast();

  const [editPeriod, setEditPeriod] = useState<Period | null>(null);
  const [editMember, setEditMember] = useState<OrganizationMember | null>(null);
  const [photoName, setPhotoName] = useState("");

  /* ── Period form ── */
  const periodForm = useForm<PeriodForm>({
    resolver: zodResolver(periodSchema),
    defaultValues: { cabinet_name: "", year_start: new Date().getFullYear(), year_end: new Date().getFullYear() + 1 },
  });

  /* ── Member form ── */
  const memberForm = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", role_position: "", department: "", linkedin_url: "", instagram_url: "" },
  });

  useEffect(() => { loadPeriods(); }, []);

  async function loadPeriods() {
    if (!supabase) return;
    const { data } = await supabase.from("periods").select("*").order("year_start", { ascending: false });
    const list = (data ?? []) as Period[];
    setPeriods(list);
    const active = list.find(p => p.is_active) ?? list[0];
    if (active) { setSelectedPeriodId(active.id); loadMembers(active.id); }
  }

  async function loadMembers(periodId: string) {
    if (!supabase) return;
    const { data } = await supabase.from("organization_members").select("*").eq("period_id", periodId).order("display_order");
    setMembers((data ?? []) as OrganizationMember[]);
  }

  async function onCreatePeriod(data: PeriodForm) {
    if (!supabase) return;
    try {
      const { data: row, error } = await supabase.from("periods")
        .insert({ cabinet_name: data.cabinet_name, year_start: data.year_start, year_end: data.year_end, is_active: false })
        .select().single();
      if (error) throw error;
      setPeriods([row as Period, ...periods]);
      setSelectedPeriodId(row.id);
      periodForm.reset();
      toast({ title: "Periode berhasil dibuat!", variant: "success" as any });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Gagal membuat periode.", variant: "error" as any }); }
  }

  async function activatePeriod(id: string) {
    if (!supabase) return;
    try {
      await supabase.from("periods").update({ is_active: false }).eq("is_active", true);
      await supabase.from("periods").update({ is_active: true }).eq("id", id);
      setPeriods(periods.map(p => ({ ...p, is_active: p.id === id })));
      toast({ title: "Periode aktif berhasil diganti!", variant: "success" as any });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Gagal mengaktifkan.", variant: "error" as any }); }
  }

  async function deletePeriod(id: string) {
    if (!supabase || !confirm("Hapus periode ini? Semua pengurus di periode ini ikut terhapus.")) return;
    const { error } = await supabase.from("periods").delete().eq("id", id);
    if (error) { toast({ title: error.message, variant: "error" as any }); return; }
    const updated = periods.filter(p => p.id !== id);
    setPeriods(updated);
    if (selectedPeriodId === id) {
      const next = updated[0];
      if (next) { setSelectedPeriodId(next.id); loadMembers(next.id); }
      else { setSelectedPeriodId(""); setMembers([]); }
    }
    toast({ title: "Periode dihapus.", variant: "success" as any });
  }

  async function onAddMember(data: MemberForm) {
    if (!supabase || !selectedPeriodId) return;
    try {
      let photo_url: string | null = null;
      const file = (document.getElementById("member-photo") as HTMLInputElement)?.files?.[0];
      if (file) {
        const compressed = await imageCompression(file, { maxSizeMB: 0.15, maxWidthOrHeight: 1100, useWebWorker: true });
        const path = `${selectedPeriodId}/${Date.now()}-${compressed.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
        const { error: uploadErr } = await supabase.storage.from("organization-photos").upload(path, compressed, { upsert: true, contentType: compressed.type });
        if (uploadErr) throw uploadErr;
        photo_url = supabase.storage.from("organization-photos").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("organization_members").insert({
        period_id: selectedPeriodId,
        name: data.name, role_position: data.role_position,
        department: data.department || null,
        display_order: autoOrder(data.role_position, data.department ?? "", members),
        linkedin_url: data.linkedin_url || null,
        instagram_url: data.instagram_url || null,
        photo_url,
      });
      if (error) throw error;
      memberForm.reset();
      setPhotoName("");
      (document.getElementById("member-photo") as HTMLInputElement).value = "";
      await loadMembers(selectedPeriodId);
      toast({ title: "Pengurus berhasil ditambahkan!", variant: "success" as any });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Gagal menambahkan pengurus.", variant: "error" as any }); }
  }

  async function deleteMember(id: string) {
    if (!supabase || !confirm("Hapus pengurus ini?")) return;
    const { error } = await supabase.from("organization_members").delete().eq("id", id);
    if (error) { toast({ title: error.message, variant: "error" as any }); return; }
    setMembers(members.filter(m => m.id !== id));
    toast({ title: "Pengurus dihapus.", variant: "success" as any });
  }

  const pe = periodForm.formState.errors;
  const me = memberForm.formState.errors;

  return (
    <PageFrame>
      <PageIntro number="ADMIN" label="KEPENGURUSAN"
        title="Kelola Pengurus FORTI" />

      {editPeriod && (
        <EditPeriodModal period={editPeriod} onClose={() => setEditPeriod(null)}
          onSave={updated => { setPeriods(periods.map(p => p.id === updated.id ? updated : p)); setEditPeriod(null); }} />
      )}
      {editMember && (
        <EditMemberModal member={editMember} allMembers={members} onClose={() => setEditMember(null)}
          onSave={updated => { setMembers(members.map(m => m.id === updated.id ? updated : m)); setEditMember(null); }} />
      )}

      <section className="px-[6%] py-16">
        <SupabaseNotice />
        {!isSupabaseConfigured ? null : (
          <AdminGuard>
            <AdminNav />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Left: Forms */}
              <div className="grid gap-8 content-start">

                {/* Create period */}
                <div className="card-navy p-6">
                  <h2 className="font-display font-semibold text-[18px] text-[#f0f6fc] mb-1">Buat periode baru</h2>
                  <p className="text-[11px] text-[#7a9ab8] mb-4">Periode yang dibuat tidak otomatis aktif.</p>
                  <form onSubmit={periodForm.handleSubmit(onCreatePeriod)} className="grid gap-3">
                    <div className="grid gap-1.5">
                      <input {...periodForm.register("cabinet_name")} placeholder="Nama kabinet (misal: Kabinet Sinergi)" className="field-input" />
                      <FieldError msg={pe.cabinet_name?.message} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <span className="field-label">Tahun mulai</span>
                        <input type="number" {...periodForm.register("year_start")} onFocus={e => e.target.select()} className="field-input" />
                        <FieldError msg={pe.year_start?.message} />
                      </div>
                      <div className="grid gap-1.5">
                        <span className="field-label">Tahun akhir</span>
                        <input type="number" {...periodForm.register("year_end")} onFocus={e => e.target.select()} className="field-input" />
                        <FieldError msg={pe.year_end?.message} />
                      </div>
                    </div>
                    <button disabled={periodForm.formState.isSubmitting} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60">
                      <Plus size={14} /> Buat periode
                    </button>
                  </form>
                </div>

                {/* Add member */}
                <div className="card-navy p-6">
                  <h2 className="font-display font-semibold text-[18px] text-[#f0f6fc] mb-1">Tambah pengurus</h2>
                  <p className="text-[11px] text-[#7a9ab8] mb-4">Foto dikecilkan otomatis sebelum diunggah.</p>
                  <form onSubmit={memberForm.handleSubmit(onAddMember)} className="grid gap-3">
                    <div className="grid gap-1.5">
                      <span className="field-label">Periode</span>
                      <select required value={selectedPeriodId}
                        onChange={e => { setSelectedPeriodId(e.target.value); loadMembers(e.target.value); }}
                        className="field-input">
                        <option value="">Pilih periode</option>
                        {periods.map(p => (
                          <option key={p.id} value={p.id}>{p.cabinet_name} · {p.year_start}/{p.year_end}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <input {...memberForm.register("name")} placeholder="Nama lengkap" className="field-input" />
                      <FieldError msg={me.name?.message} />
                    </div>
                    <div className="grid gap-1.5">
                      <input {...memberForm.register("role_position")} placeholder="Jabatan (Ketua Umum, Sekretaris…)" className="field-input" />
                      <FieldError msg={me.role_position?.message} />
                    </div>
                    <input {...memberForm.register("department")} placeholder="Divisi (opsional)" className="field-input" />
                    <div className="grid gap-1.5">
                      <input {...memberForm.register("linkedin_url")} placeholder="URL LinkedIn (opsional)" className="field-input" />
                      <FieldError msg={me.linkedin_url?.message} />
                    </div>
                    <div className="grid gap-1.5">
                      <input {...memberForm.register("instagram_url")} placeholder="URL Instagram (opsional)" className="field-input" />
                      <FieldError msg={me.instagram_url?.message} />
                    </div>
                    <label htmlFor="member-photo" className="flex cursor-pointer items-center gap-2 border border-dashed border-[#2d4a63] p-3 hover:border-[#29abe2] transition-colors rounded-lg">
                      <Upload size={13} className="text-[#4d7a9e] shrink-0" />
                      <span className="text-[10px] text-[#7a9ab8] hover:text-[#29abe2] transition-colors truncate">
                        {photoName || "Foto pengurus"}
                      </span>
                      <input id="member-photo" type="file" accept="image/*" className="hidden"
                        onChange={e => setPhotoName(e.target.files?.[0]?.name ?? "")} />
                    </label>
                    <button disabled={memberForm.formState.isSubmitting} className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60">
                      <Plus size={14} /> Tambah pengurus
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: Lists */}
              <div className="grid gap-8 content-start">

                {/* Periods list */}
                <div className="card-navy p-6">
                  <h3 className="font-display font-semibold text-[18px] text-[#f0f6fc] mb-4">Daftar periode</h3>
                  {periods.length === 0 && <div className="empty-state">Belum ada periode.</div>}
                  <div className="divide-y divide-[#2d4a63]">
                    {periods.map(p => (
                      <div key={p.id} className="flex justify-between items-center gap-3 py-3">
                        <div className="flex-1 min-w-0">
                          <strong className="font-display font-medium text-[13px] text-[#f0f6fc] block truncate">{p.cabinet_name}</strong>
                          <small className="font-mono-code text-[9px] text-[#4d7a9e]">{p.year_start} / {p.year_end}</small>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {p.is_active
                            ? <span className="font-mono-code text-[9px] tracking-wide bg-[#29abe215] border border-[#29abe230] text-[#29abe2] px-2 py-1 rounded-full">AKTIF</span>
                            : <button onClick={() => activatePeriod(p.id)} className="btn-primary flex items-center gap-1 text-[9px] px-2.5 py-1.5">
                                <Check size={10} /> Aktifkan
                              </button>
                          }
                          <button onClick={() => setEditPeriod(p)} className="p-1.5 text-[#4d7a9e] hover:text-[#29abe2] transition-colors" title="Edit">
                            <Pencil size={13} />
                          </button>
                          {!p.is_active && (
                            <button onClick={() => deletePeriod(p.id)} className="p-1.5 text-[#4d7a9e] hover:text-red-400 transition-colors" title="Hapus">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Members list */}
                <div className="card-navy p-6">
                  <h3 className="font-display font-semibold text-[18px] text-[#f0f6fc] mb-1">
                    Pengurus {periods.find(p => p.id === selectedPeriodId)?.cabinet_name ?? "—"}
                  </h3>
                  <p className="text-[11px] text-[#7a9ab8] mb-4">{members.length} orang terdaftar</p>
                  {members.length === 0 && <div className="empty-state">Belum ada pengurus untuk periode ini.</div>}
                  <div className="divide-y divide-[#2d4a63]">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#1e3040] overflow-hidden grid place-items-center font-mono-code text-[10px] text-[#29abe2] shrink-0">
                            {m.photo_url
                              ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" />
                              : m.name.split(" ").map(x => x[0]).slice(0, 2).join("")
                            }
                          </div>
                          <div className="min-w-0">
                            <strong className="text-[12px] font-semibold text-[#f0f6fc] block truncate">{m.name}</strong>
                            <span className="text-[9px] text-[#4d7a9e] truncate block">{m.role_position}{m.department ? ` · ${m.department}` : ""}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setEditMember(m)} className="p-1.5 text-[#4d7a9e] hover:text-[#29abe2] transition-colors" title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deleteMember(m.id)} className="p-1.5 text-[#4d7a9e] hover:text-red-400 transition-colors" title="Hapus">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AdminGuard>
        )}
      </section>
    </PageFrame>
  );
}
