"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Code2 } from "lucide-react";
import { FinalProject, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { PageFrame, PageIntro, SupabaseNotice } from "@/app/components";

const ACCENTS = ["#29abe2", "#3dbef5", "#b0c4d8", "#1a8cc4", "#4d7a9e"];

export default function ShowcasePage() {
  const [items, setItems] = useState<FinalProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.from("final_projects").select("*").eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setItems((data ?? []) as FinalProject[]); setLoading(false); });
  }, []);

  return (
    <PageFrame>
      <PageIntro
        number="02"
        label="ETALASE KARYA"
        title={<>Ide yang jadi<br /><span className="text-[#29abe2]">nyata.</span></>}
        description="Proyek pilihan mahasiswa FoRTI yang dibangun dari rasa ingin tahu, kolaborasi, dan keberanian mencoba."
      />
      <section className="px-[6%] py-16">
        <SupabaseNotice />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <span className="font-mono-code text-[10px] text-[#4d7a9e] tracking-widest">{items.length} KARYA TERKURASI</span>
          <Link href="/dashboard/project" className="btn-primary text-[12px] px-4 py-2.5">
            <Code2 size={13} /> Kirim karyamu
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-[13px] text-[#4d7a9e] py-12">Memuat karya…</p>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {items.map((p, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <article key={p.id} className="card-navy overflow-hidden group">
                  {/* Art */}
                  <div className="relative h-[200px] bg-[#111e2a] overflow-hidden">
                    {p.thumbnail_url ? (
                      <Image src={p.thumbnail_url} alt={p.title} fill sizes="(max-width:768px) 90vw, 30vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <>
                        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 40% 50%, ${accent}18, transparent 70%)` }} />
                        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${accent}10 1px, transparent 1px), linear-gradient(90deg, ${accent}10 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
                        <span className="absolute top-3 left-4 font-mono-code text-[9px] tracking-widest" style={{ color: accent }}>WEB APP / {String(i + 1).padStart(2, "0")}</span>
                      </>
                    )}
                    <span className="absolute right-3 bottom-3 bg-[#111e2a]/80 backdrop-blur-sm px-2 py-0.5 rounded font-mono-code text-[9px]" style={{ color: accent }}>
                      WEB APP
                    </span>
                  </div>
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-mono-code text-[9px] text-[#4d7a9e]">{p.tech_stack?.join(" · ")}</span>
                        <h3 className="font-display font-bold text-[17px] text-[#f0f6fc] mt-0.5">{p.title}</h3>
                      </div>
                      {p.demo_url && (
                        <a href={p.demo_url} target="_blank" rel="noreferrer" className="text-[#2d4a63] group-hover:text-[#29abe2] transition-colors mt-0.5">
                          <ArrowUpRight size={17} />
                        </a>
                      )}
                    </div>
                    <p className="text-[12px] text-[#7a9ab8] leading-[1.7]">{p.tagline ?? p.description}</p>
                    {p.repo_url && (
                      <a href={p.repo_url} target="_blank" rel="noreferrer" className="inline-block font-mono-code text-[9px] text-[#4d7a9e] hover:text-[#29abe2] mt-2 transition-colors">repo ↗</a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            {isSupabaseConfigured
              ? "Belum ada karya yang dipublikasikan."
              : "Galeri publik siap setelah Supabase tersambung."
            }
          </div>
        )}
      </section>
    </PageFrame>
  );
}
