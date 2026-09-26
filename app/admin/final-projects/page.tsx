"use client";

import { useEffect, useState } from "react";
import { Check, X, RotateCcw } from "lucide-react";
import { PageFrame, PageIntro, SupabaseNotice } from "@/app/components";
import { AdminGuard, AdminNav } from "@/app/admin/_guard";
import { FinalProject, isSupabaseConfigured, statusLabel, supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Tab = "pending" | "published" | "rejected";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-900/20 border border-yellow-500/20 text-yellow-400",
    published: "bg-[#29abe215] border border-[#29abe230] text-[#29abe2]",
    rejected: "bg-red-900/20 border border-red-500/20 text-red-400",
  };
  return (
    <span className={`mono-label font-mono-code text-[9px] tracking-wide px-2 py-1 rounded-full ${map[status] ?? "bg-[#1e3040] border border-[#2d4a63] text-[#7a9ab8]"}`}>
      {statusLabel(status as any)}
    </span>
  );
}

export default function AdminFinalProjectsPage() {
  const [projects, setProjects] = useState<FinalProject[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from("final_projects").select("*").order("created_at", { ascending: false });
    setProjects((data ?? []) as FinalProject[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: "published" | "rejected" | "pending") {
    if (!supabase) return;
    const { error } = await supabase.from("final_projects").update({ status }).eq("id", id);
    if (error) { toast({ title: error.message, variant: "error" as any }); return; }
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    const labels: Record<string, string> = { published: "dipublikasikan", rejected: "ditolak", pending: "dikembalikan ke pending" };
    toast({ title: `Karya berhasil ${labels[status]}!`, variant: "success" as any });
  }

  const filtered = projects.filter(p => p.status === tab);
  const counts = {
    pending: projects.filter(p => p.status === "pending").length,
    published: projects.filter(p => p.status === "published").length,
    rejected: projects.filter(p => p.status === "rejected").length,
  };

  return (
    <PageFrame>
      <PageIntro number="ADMIN" label="FINAL PROJECT" title="Kurasi Karya Mahasiswa" />
      <section className="px-[6%] py-16">
        <SupabaseNotice />
        {!isSupabaseConfigured ? null : (
          <AdminGuard>
            <AdminNav />

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[#2d4a63] mb-6">
              {(["pending", "published", "rejected"] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-3 text-[11px] border-b-2 transition-colors ${
                    tab === t
                      ? "text-[#29abe2] border-[#29abe2] font-semibold"
                      : "text-[#4d7a9e] border-transparent hover:text-[#7a9ab8]"
                  }`}
                >
                  {t === "pending" ? "Menunggu" : t === "published" ? "Dipublikasikan" : "Ditolak"} ({counts[t]})
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-[12px] text-[#7a9ab8] text-center py-10">Memuat…</p>
            ) : (
              <div className="grid gap-3">
                {filtered.length === 0 && (
                  <div className="empty-state">
                    Tidak ada karya dengan status ini.
                  </div>
                )}
                {filtered.map(p => (
                  <div key={p.id} className="card-navy flex flex-col md:flex-row items-start justify-between gap-5 p-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="mono-label font-mono-code text-[9px] tracking-wide text-[#4d7a9e] bg-[#1e3040] px-2 py-1 rounded-sm">{p.category}</span>
                        <span className="mono-label font-mono-code text-[9px] text-[#4d7a9e]">{p.tech_stack?.join(" · ")}</span>
                      </div>
                      {p.thumbnail_url && (
                        <img src={p.thumbnail_url} alt="" className="w-full max-w-[320px] aspect-video object-cover rounded-lg mb-3 border border-[#2d4a63]" />
                      )}
                      <h3 className="font-display font-medium text-[18px] tracking-[-0.3px] text-[#f0f6fc] mb-1">{p.title}</h3>
                      <p className="text-[11px] text-[#7a9ab8] leading-[1.7] mb-3">{p.tagline}{p.tagline && p.description ? " " : ""}{p.description}</p>
                      <div className="flex gap-4 flex-wrap">
                        {p.demo_url && (
                          <a href={p.demo_url} target="_blank" rel="noreferrer" className="text-[10px] text-[#29abe2] hover:text-[#f0f6fc] font-semibold transition-colors">
                            Buka demo ↗
                          </a>
                        )}
                        {p.repo_url && (
                          <a href={p.repo_url} target="_blank" rel="noreferrer" className="text-[10px] text-[#29abe2] hover:text-[#f0f6fc] font-semibold transition-colors">
                            Repositori ↗
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={p.status} />
                      {p.status === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(p.id, "published")}
                            className="btn-primary flex items-center gap-1.5 text-[10px] px-3 py-2 whitespace-nowrap"
                          >
                            <Check size={12} /> Publikasikan
                          </button>
                          <button
                            onClick={() => updateStatus(p.id, "rejected")}
                            className="flex items-center gap-1.5 bg-red-900/20 border border-red-500/30 text-red-400 px-3 py-2 text-[10px] font-semibold rounded-lg hover:bg-red-900/30 transition-colors whitespace-nowrap"
                          >
                            <X size={12} /> Tolak
                          </button>
                        </>
                      )}
                      {(p.status === "published" || p.status === "rejected") && (
                        <button
                          onClick={() => updateStatus(p.id, "pending")}
                          className="btn-outline flex items-center gap-1.5 text-[10px] px-3 py-2 whitespace-nowrap"
                        >
                          <RotateCcw size={11} /> Ke pending
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
