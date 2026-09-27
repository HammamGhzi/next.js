"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Search } from "lucide-react";
import { isSupabaseConfigured, PkmSubmission, supabase } from "@/lib/supabase";
import { PageFrame, PageIntro, SupabaseNotice } from "@/app/components";

const SCHEMES = ["Semua", "PKM-KC", "PKM-RE", "PKM-RSH", "PKM-PM", "PKM-PI", "PKM-K", "PKM-VGK", "PKM-AI", "PKM-GFT", "PKM-KI"];

export default function PkmPage() {
  const [items, setItems] = useState<PkmSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from("pkm_submissions").select("*").eq("status", "published")
      .order("submitted_at", { ascending: false })
      .then(({ data }) => { setItems((data ?? []) as PkmSubmission[]); setLoading(false); });
  }, []);

  const filtered = items
    .filter(p => filter === "Semua" || p.scheme === filter)
    .filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.abstract ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <PageFrame>
      <PageIntro
        label="REPOSITORI GAGASAN"
        title={<>Kumpulan ide<br /><span className="text-[#29abe2]">yang berdampak</span></>}
        description="Katalog karya Program Kreativitas Mahasiswa FoRTI. Baca ringkasan, temukan inspirasi, jelajahi dokumen."
      />
      <section className="px-[6%] py-16">
        <SupabaseNotice />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <span className="font-mono-code text-[10px] text-[#4d7a9e] tracking-widest">{filtered.length} KARYA TERPUBLIKASI</span>
          <Link href="/dashboard/pkm" className="btn-primary text-[12px] px-4 py-2.5">
            <BookOpen size={13} /> Arsipkan karyamu
          </Link>
        </div>

        {/* Search & filter */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-[360px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4d7a9e]" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul atau kata kunci…"
              className="field-input pl-9" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="field-input w-auto">
            {SCHEMES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-[13px] text-[#4d7a9e] py-12">Memuat katalog…</p>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-[#2d4a63]">
            {filtered.map((p, i) => (
              <article key={p.id} className="flex flex-col sm:grid sm:grid-cols-[40px_1fr_auto] gap-3 sm:gap-5 py-6 items-start group">
                <span className="font-mono-code text-[13px] text-[#29abe2]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono-code text-[9px] tracking-wide bg-[#29abe215] border border-[#29abe230] text-[#29abe2] px-2 py-0.5 rounded-full">{p.scheme}</span>
                    <span className="font-mono-code text-[9px] text-[#4d7a9e]">Pendamping: {p.supervisor_name}</span>
                  </div>
                  <h2 className="font-display font-semibold text-[18px] text-[#f0f6fc] mb-2">{p.title}</h2>
                  {p.abstract && (
                    <p className="text-[12px] text-[#7a9ab8] leading-[1.8] max-w-[700px] line-clamp-3">{p.abstract}</p>
                  )}
                  <a href={p.drive_proposal_url} target="_blank" rel="noreferrer"
                    className="sm:hidden inline-block font-mono-code text-[9px] text-[#4d7a9e] hover:text-[#29abe2] transition-colors mt-2 flex items-center gap-1">
                    Buka proposal <ArrowUpRight size={12} />
                  </a>
                </div>
                <a href={p.drive_proposal_url} target="_blank" rel="noreferrer"
                  className="hidden sm:flex font-mono-code text-[9px] text-[#4d7a9e] hover:text-[#29abe2] transition-colors items-center gap-1 mt-0.5 whitespace-nowrap">
                  Buka <ArrowUpRight size={12} />
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            {isSupabaseConfigured
              ? search || filter !== "Semua" ? "Tidak ada hasil untuk filter ini." : "Belum ada PKM yang dipublikasikan."
              : "Katalog siap setelah Supabase tersambung."
            }
          </div>
        )}
      </section>
    </PageFrame>
  );
}
