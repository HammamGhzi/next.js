"use client";

import { useEffect, useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { PageFrame, PageIntro, SupabaseNotice } from "@/app/components";
import { AdminGuard, AdminNav } from "@/app/admin/_guard";
import { isSupabaseConfigured, PkmSubmission, statusLabel, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Tab = "submitted" | "published" | "rejected";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: "bg-yellow-900/20 border border-yellow-500/20 text-yellow-400",
    under_review: "bg-yellow-900/20 border border-yellow-500/20 text-yellow-400",
    verified: "bg-[#29abe215] border border-[#29abe230] text-[#29abe2]",
    published: "bg-[#29abe215] border border-[#29abe230] text-[#29abe2]",
    rejected: "bg-red-900/20 border border-red-500/20 text-red-400",
  };
  return (
    <span className={`mono-label font-mono-code text-[9px] tracking-wide px-2 py-1 rounded-full ${map[status] ?? "bg-[#1e3040] border border-[#2d4a63] text-[#7a9ab8]"}`}>
      {statusLabel(status as any)}
    </span>
  );
}

export default function AdminPkmPage() {
  const [pkms, setPkms] = useState<PkmSubmission[]>([]);
  const [tab, setTab] = useState<Tab>("submitted");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from("pkm_submissions").select("*").order("submitted_at", { ascending: false });
    setPkms((data ?? []) as PkmSubmission[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: "published" | "rejected" | "submitted") {
    if (!supabase) return;
    const { error } = await supabase.from("pkm_submissions").update({ status }).eq("id", id);
    if (error) { toast({ title: error.message, variant: "error" as any }); return; }
    setPkms(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    const labels: Record<string, string> = { published: "dipublikasikan", rejected: "ditolak", submitted: "dikembalikan ke antrian" };
    toast({ title: `PKM berhasil ${labels[status]}!`, variant: "success" as any });
  }

  const filtered = pkms.filter(p => p.status === tab);
  const counts = {
    submitted: pkms.filter(p => p.status === "submitted" || p.status === "under_review").length,
    published: pkms.filter(p => p.status === "published" || p.status === "verified").length,
    rejected: pkms.filter(p => p.status === "rejected").length,
  };

  return (
    <PageFrame>
      <PageIntro number="ADMIN" label="VERIFIKASI PKM" title="Verifikasi Proposal PKM" />
      <section className="px-[6%] py-16">
        <SupabaseNotice />
        {!isSupabaseConfigured ? null : (
          <AdminGuard>
            <AdminNav />

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[#2d4a63] mb-6">
              {(["submitted", "published", "rejected"] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-3 text-[11px] border-b-2 transition-colors ${
                    tab === t
                      ? "text-[#29abe2] border-[#29abe2] font-semibold"
                      : "text-[#4d7a9e] border-transparent hover:text-[#7a9ab8]"
                  }`}
                >
                  {t === "submitted" ? "Antrian" : t === "published" ? "Dipublikasikan" : "Ditolak"} ({counts[t]})
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-[12px] text-[#7a9ab8] text-center py-10">Memuat…</p>
            ) : (
              <div className="grid gap-3">
                {filtered.length === 0 && (
                  <div className="empty-state">
                    Tidak ada PKM dengan status ini.
                  </div>
                )}
                {filtered.map(p => (
                  <div key={p.id} className="card-navy flex flex-col md:flex-row items-start justify-between gap-5 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="mono-label font-mono-code text-[9px] tracking-wide bg-[#1e3040] border border-[#2d4a63] text-[#29abe2] px-2 py-1 rounded-full">{p.scheme}</span>
                        <span className="mono-label font-mono-code text-[9px] text-[#4d7a9e]">Pendamping: {p.supervisor_name}</span>
                      </div>
                      <h3 className="font-display font-medium text-[18px] tracking-[-0.3px] text-[#f0f6fc] mb-2">{p.title}</h3>
                      {p.abstract && (
                        <p className="text-[11px] text-[#7a9ab8] leading-[1.8] mb-3 max-w-[700px]">{p.abstract}</p>
                      )}
                      <a
                        href={p.drive_proposal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mono-label font-mono-code text-[9px] font-semibold text-[#29abe2] hover:text-[#f0f6fc] transition-colors"
                      >
                        Buka dokumen Drive ↗
                      </a>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={p.status} />
                      {(p.status === "submitted" || p.status === "under_review") && (
                        <>
                          <button
                            onClick={() => updateStatus(p.id, "published")}
                            className="btn-primary flex items-center gap-1.5 text-[10px] px-3 py-2 whitespace-nowrap"
                          >
                            <Check size={12} /> Verifikasi & Publikasikan
                          </button>
                          <button
                            onClick={() => updateStatus(p.id, "rejected")}
                            className="flex items-center gap-1.5 bg-red-900/20 border border-red-500/30 text-red-400 px-3 py-2 text-[10px] font-semibold rounded-lg hover:bg-red-900/30 transition-colors whitespace-nowrap"
                          >
                            <X size={12} /> Tolak
                          </button>
                        </>
                      )}
                      {(p.status === "published" || p.status === "verified" || p.status === "rejected") && (
                        <button
                          onClick={() => updateStatus(p.id, "submitted")}
                          className="btn-outline flex items-center gap-1.5 text-[10px] px-3 py-2 whitespace-nowrap"
                        >
                          <RotateCcw size={11} /> Ke antrian
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminGuard>
        )}
      </section>
    </PageFrame>
  );
}
