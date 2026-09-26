"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Code2, LoaderCircle, Plus, Users } from "lucide-react";
import { PageFrame, PageIntro, SupabaseNotice } from "@/app/components";
import { FinalProject, isSupabaseConfigured, PkmSubmission, supabase, Team, statusLabel } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:      "bg-yellow-900/20 border border-yellow-500/20 text-yellow-400",
    published:    "bg-[#29abe215] border border-[#29abe230] text-[#29abe2]",
    rejected:     "bg-red-900/20 border border-red-500/20 text-red-400",
    submitted:    "bg-[#29abe215] border border-[#29abe230] text-[#29abe2]",
    under_review: "bg-yellow-900/20 border border-yellow-500/20 text-yellow-400",
    verified:     "bg-[#29abe215] border border-[#29abe230] text-[#29abe2]",
    draft:        "bg-yellow-900/20 border border-yellow-500/20 text-yellow-400",
  };
  return (
    <span className={`mono-label text-[9px] tracking-wide px-2 py-1 rounded-full ${map[status] ?? "bg-yellow-900/20 border border-yellow-500/20 text-yellow-400"}`}>
      {statusLabel(status as any)}
    </span>
  );
}

/* ─── Team Panel ─── */
function TeamPanel({ userId, onTeam }: { userId: string; onTeam: (id: string) => void }) {
  const [team, setTeam] = useState<(Team & { isLeader: boolean }) | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!supabase || !userId) return;
    (async () => {
      const { data: ownTeam } = await supabase!.from("teams").select("*").eq("leader_id", userId).maybeSingle();
      if (ownTeam) { setTeam({ ...ownTeam, isLeader: true }); onTeam(ownTeam.id); return; }
      const { data: membership } = await supabase!.from("team_members").select("team_id").eq("profile_id", userId).maybeSingle();
      if (membership) {
        const { data: mt } = await supabase!.from("teams").select("*").eq("id", membership.team_id).single();
        if (mt) { setTeam({ ...mt, isLeader: false }); onTeam(mt.id); }
      }
    })();
  }, [userId, onTeam]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.from("teams").insert({ team_name: name, contact_wa: phone || null, leader_id: userId }).select("*").single();
      if (error) throw error;
      await supabase.from("team_members").insert({ team_id: data.id, profile_id: userId, member_role: "leader" });
      setTeam({ ...data, isLeader: true }); onTeam(data.id);
      toast({ title: "Tim berhasil dibuat!", variant: "success" as any });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Gagal membuat tim.", variant: "error" as any }); }
    finally { setBusy(false); }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !team) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("add_team_member_by_email", { team_uuid: team.id, member_email: invite });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInvite("");
      toast({ title: `${data?.member_name ?? "Anggota"} berhasil ditambahkan!`, variant: "success" as any });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Gagal menambahkan anggota.", variant: "error" as any }); }
    finally { setBusy(false); }
  }

  return (
    <div className="card-navy p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
      <div>
        <span className="mono-label text-[9px] tracking-[1.1px] text-[#7a9ab8]">KOLABORASI</span>
        <h2 className="font-display font-medium text-[18px] tracking-[-0.3px] mt-2 mb-1 text-[#f0f6fc]">
          {team ? team.team_name : "Buat tim untuk mengirim karya bersama"}
        </h2>
        <p className="text-[10px] text-[#7a9ab8]">
          {team ? `WhatsApp: ${team.contact_wa ?? "belum ditambahkan"}` : "Karya yang dikirim akan terhubung ke tim."}
        </p>
      </div>
      <div>
        {team?.isLeader ? (
          <form onSubmit={addMember} className="flex gap-2">
            <input required type="email" value={invite} onChange={e => setInvite(e.target.value)}
              placeholder="Email anggota terdaftar"
              className="field-input flex-1 min-w-0" />
            <button disabled={busy} className="btn-primary flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-semibold disabled:opacity-60 whitespace-nowrap">
              {busy ? <LoaderCircle size={12} className="animate-spin" /> : <Plus size={12} />} Undang
            </button>
          </form>
        ) : team ? (
          <p className="text-[10px] text-[#7a9ab8] bg-[#1e3040] border border-[#2d4a63] p-3 rounded-lg">
            Kamu anggota tim ini. Hubungi ketua untuk mengelola daftar anggota.
          </p>
        ) : (
          <form onSubmit={create} className="grid gap-2">
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Nama tim"
              className="field-input" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp ketua (opsional)"
              className="field-input" />
            <button disabled={busy} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-[10px] font-semibold disabled:opacity-60">
              {busy ? <LoaderCircle size={12} className="animate-spin" /> : <Users size={12} />} Buat tim
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── My Submissions ─── */
function MySubmissions({ userId }: { userId: string }) {
  const [rows, setRows] = useState<{ label: string; title: string; status: string; date: string }[]>([]);

  useEffect(() => {
    if (!supabase || !userId) return;
    (async () => {
      const [{ data: projects }, { data: pkms }] = await Promise.all([
        supabase!.from("final_projects").select("title,status,created_at").eq("submitted_by", userId).order("created_at", { ascending: false }),
        supabase!.from("pkm_submissions").select("title,status,submitted_at").eq("submitted_by", userId).order("submitted_at", { ascending: false }),
      ]);
      setRows([
        ...(projects ?? []).map((p: any) => ({ label: "Final Project", title: p.title, status: p.status, date: p.created_at })),
        ...(pkms ?? []).map((p: any) => ({ label: "Arsip PKM", title: p.title, status: p.status, date: p.submitted_at })),
      ].sort((a, b) => b.date.localeCompare(a.date)));
    })();
  }, [userId]);

  if (!rows.length) return null;
  return (
    <div className="mt-9">
      <div className="flex items-center gap-[9px] mono-label text-[10px] tracking-[1.1px] text-[#7a9ab8] mb-3 pb-3 border-b border-[#2d4a63]">
        <span className="text-[#29abe2]">STATUS</span> / KARYA SAYA
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-4 border-b border-[#2d4a63]">
          <div className="grid gap-1.5 min-w-0">
            <span className="mono-label text-[9px] text-[#7a9ab8]">{row.label}</span>
            <strong className="font-display font-medium text-[13px] text-[#f0f6fc] leading-snug">{row.title}</strong>
          </div>
          <StatusBadge status={row.status} />
        </div>
      ))}
    </div>
  );
}

/* ─── Page ─── */
export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [teamId, setTeamId] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      setUserId(data.user.id);
      const { data: profile } = await supabase!.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
      setFullName(profile?.full_name ?? data.user.email ?? "");
    });
  }, [router]);

  return (
    <PageFrame>
      <PageIntro
        number="01"
        label="RUANG ANGGOTA"
        title={<>Halo, <em className="not-italic text-[#29abe2]">{fullName || "pembelajar"}.</em></>}
        description="Kirim karya final project atau arsipkan proposal PKM-mu. Semua dikelola dari sini."
      />

      <section className="px-[6%] py-16 min-h-[420px] bg-[#111e2a]">
        <SupabaseNotice />

        {!isSupabaseConfigured ? (
          <div className="border border-dashed border-[#2d4a63] p-9 text-center text-[12px] text-[#7a9ab8]">
            Hubungkan Supabase untuk mulai mengirim karya.
          </div>
        ) : (
          <>
            <TeamPanel userId={userId} onTeam={setTeamId} />

            {/* CTA Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Link href="/dashboard/project" className="group card-navy p-5 hover:border-[#29abe2] hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-full bg-[#29abe215] border border-[#29abe230] grid place-items-center text-[#29abe2] mb-3">
                  <Code2 size={17} />
                </div>
                <h3 className="font-display font-medium text-[17px] tracking-[-0.3px] mb-1 text-[#f0f6fc]">Final Project</h3>
                <p className="text-[11px] text-[#7a9ab8] leading-[1.7] mb-3">Upload karya dengan live preview kartu portfolio. Status pending sampai dikurasi admin.</p>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#29abe2] group-hover:text-[#f0f6fc] transition-colors">
                  Kirim project <ArrowRight size={13} />
                </span>
              </Link>

              <Link href="/dashboard/pkm" className="group card-navy p-5 hover:border-[#29abe2] hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-full bg-[#29abe215] border border-[#29abe230] grid place-items-center text-[#29abe2] mb-3">
                  <BookOpen size={17} />
                </div>
                <h3 className="font-display font-medium text-[17px] tracking-[-0.3px] mb-1 text-[#f0f6fc]">Arsip PKM</h3>
                <p className="text-[11px] text-[#7a9ab8] leading-[1.7] mb-3">Simpan proposal PKM final dengan tautan Google Drive. Akan diverifikasi admin sebelum tampil publik.</p>
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#29abe2] group-hover:text-[#f0f6fc] transition-colors">
                  Arsipkan PKM <ArrowRight size={13} />
                </span>
              </Link>
            </div>

            <MySubmissions userId={userId} />
          </>
        )}
      </section>
    </PageFrame>
  );
}
