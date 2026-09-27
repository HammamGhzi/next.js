"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight,
  Code2, Lightbulb,
  Menu, X, ChevronLeft, ChevronRight, ExternalLink,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase, NewsPost, OrganizationMember, FinalProject, PkmSubmission } from "@/lib/supabase";

const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loader">
      <div className="scene-loader-ring" />
      <span>INITIALIZING...</span>
    </div>
  ),
});



export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [newsIndex, setNewsIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeMembers, setActiveMembers] = useState<OrganizationMember[]>([]);
  const [cabinet, setCabinet] = useState("");
  const [latestProjects, setLatestProjects] = useState<FinalProject[]>([]);
  const [latestPkm, setLatestPkm] = useState<PkmSubmission[]>([]);

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", s);
    return () => window.removeEventListener("scroll", s);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("news_posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setNews((data ?? []) as NewsPost[]));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data: period } = await supabase!.from("periods").select("id,cabinet_name").eq("is_active", true).maybeSingle();
      if (!period) return;
      setCabinet(period.cabinet_name);
      const { data } = await supabase!.from("organization_members").select("*").eq("period_id", period.id).order("display_order");
      setActiveMembers((data ?? []) as OrganizationMember[]);
    })();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("final_projects").select("*").eq("status", "published")
      .order("created_at", { ascending: false }).limit(3)
      .then(({ data }) => setLatestProjects((data ?? []) as FinalProject[]));
    supabase.from("pkm_submissions").select("*").eq("status", "published")
      .order("submitted_at", { ascending: false }).limit(3)
      .then(({ data }) => setLatestPkm((data ?? []) as PkmSubmission[]));
  }, []);

  const [slidesVisible, setSlidesVisible] = useState(1);

  useEffect(() => {
    const calc = () => {
      if (window.innerWidth >= 1024) setSlidesVisible(3);
      else if (window.innerWidth >= 640) setSlidesVisible(2);
      else setSlidesVisible(1);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const maxIndex = Math.max(0, news.length - slidesVisible);

  const prev = useCallback(() => setNewsIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setNewsIndex(i => Math.min(maxIndex, i + 1)), [maxIndex]);

  // autoplay
  useEffect(() => {
    if (news.length === 0) return;
    autoPlayRef.current = setInterval(() => {
      setNewsIndex(i => (i >= maxIndex ? 0 : i + 1));
    }, 4000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [news.length, maxIndex]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/pengurus", label: "Pengurus" },
    { href: "/showcase", label: "Showcase" },
    { href: "/pkm", label: "PKM" },
  ];

  return (
    <main className="bg-[#1e3040] text-[#f0f6fc] overflow-x-hidden">

      {/* ═══ HEADER ═══ */}
      <header className={`nav-bar ${scrolled ? "scrolled" : ""}`}>
        <a href="#home" className="flex items-center gap-3">
          <span className="brand-mark">
            <Image src="/images/forti-logo.jpg" alt="FoRTI" fill sizes="36px" className="object-cover" />
          </span>
          <span className="font-display font-bold text-[17px] text-[#f0f6fc]">
            FoRTI
            <span className="block font-mono-code text-[8px] font-normal tracking-[0.18em] text-[#29abe2]">FORUM RISET TI</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className="text-[13px] text-[#b0c4d8] hover:text-[#29abe2] transition-colors font-medium">{l.label}</Link>
          ))}
        </nav>

        <Link href="/login" className="hidden md:flex btn-primary text-[12px] px-4 py-2.5">
          Masuk <ArrowRight size={14} />
        </Link>
        <button className="md:hidden text-[#b0c4d8] p-1" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {menuOpen && (
          <div className="absolute top-[72px] left-0 right-0 bg-[#111e2a]/95 backdrop-blur-md border-b border-[#2d4a63] px-[6%] py-5 flex flex-col gap-4 z-50">
            {navLinks.map(l => <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-[13px] text-[#b0c4d8]">{l.label}</Link>)}
            <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-primary w-fit text-[12px]">Masuk <ArrowRight size={13} /></Link>
          </div>
        )}
      </header>

      {/* ═══ HERO ═══ */}
      <section id="home" className="relative min-h-[calc(100vh-72px)] grid grid-cols-1 xl:grid-cols-2 xl:items-center px-[6%] py-12 xl:py-0 bg-[#1e3040] overflow-x-hidden">
        {/* Grid bg */}
        <div className="grid-bg" />

        {/* Glow orbs */}
        <div className="glow-orb w-[500px] h-[500px] bg-[#29abe2] opacity-[0.07] -top-32 -right-24" />
        <div className="glow-orb w-[300px] h-[300px] bg-[#1a8cc4] opacity-[0.05] bottom-0 left-[10%]" />

        {/* Copy */}
        <div className="relative z-10 py-8 xl:py-12">
          <h1 className="font-display font-extrabold text-[clamp(36px,5vw,64px)] leading-[1.08] tracking-[-0.035em] mb-6">
            Forum Riset <span className="text-gradient">Teknologi</span> Informasi
          </h1>
        </div>

        {/* 3D Visual */}
        <div className="relative w-full h-[440px] sm:h-[520px] md:h-[580px] lg:h-[640px] xl:h-full xl:min-h-[calc(100vh-72px)] xl:max-h-[800px]">

          <div className="absolute inset-0 pointer-events-none z-0"
            style={{ background: "radial-gradient(ellipse 70% 65% at 50% 48%, #29abe218 0%, #1a3a5020 40%, transparent 75%)" }}
          />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[320px] h-[320px] rounded-full pointer-events-none z-0"
            style={{ background: "#29abe2", opacity: 0.13, filter: "blur(72px)" }}
          />

          <div className="absolute inset-0 z-[1] pointer-events-none xl:pointer-events-auto">
            <HeroScene />
          </div>

        </div>

        {/* Scan line */}
        <div className="scan-line" />
      </section>

      {/* ═══ TICKER ═══ */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...Array(2)].map((_, pass) =>
            ["FORUM RISET TEKNOLOGI INFORMASI", "PROGRAMMING", "RISET", "KOMPETISI", "FORUM RISET TEKNOLOGI INFORMASI", "PROGRAMMING", "RISET", "KOMPETISI"].map((w, i) => (
              <span key={`${pass}-${i}`} className="ticker-item">
                {w} <span className="ticker-dot">·</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ═══ ABOUT ═══ */}
      <section id="tentang" className="px-[6%] py-16 md:py-24 bg-[#111e2a] relative">
        <div className="divider-cyan mb-12 md:mb-16" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start max-w-6xl mx-auto">
          <div>
            <div className="mono-label mb-6 flex items-center gap-3">
              TENTANG KAMI
            </div>
            <h2 className="font-display font-bold text-[clamp(32px,4.5vw,58px)] leading-[1.05] tracking-tight text-[#f0f6fc] mb-0">
              Teknologi jadi<br />lebih bermakna<br />
              <span className="text-[#29abe2]">saat bersama</span>
            </h2>
          </div>

          <div className="pt-0 md:pt-2">
            <p className="text-[15px] md:text-[16px] font-medium text-[#d4e4f0] leading-[1.7] mb-5">
              FoRTI adalah singkatan dari Forum Riset Teknologi Informasi, sebuah study club mahasiswa yang berbasis di Universitas Harkat Negeri Kota Tegal.
            </p>
            <p className="text-[14px] text-[#7a9ab8] leading-[1.8]">
              Komunitas ini hadir sebagai ruang bagi mahasiswa untuk belajar, berinovasi, dan berkolaborasi di bidang teknologi informasi bersama-sama.
            </p>
          </div>
        </div>

        <div className="divider-cyan mt-12 md:mt-16" />
      </section>

      {/* ═══ TEAM PREVIEW ═══ */}
      <section className="px-[6%] py-16 md:py-20 bg-[#1e3040]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <div className="mono-label mb-4 flex items-center gap-3">
                KELUARGA FORTI
              </div>
              <h2 className="font-display font-bold text-[clamp(28px,4vw,52px)] tracking-tight text-[#f0f6fc]">
                Orang-orang<br />di balik setiap ide
              </h2>
            </div>
            <Link href="/pengurus" className="btn-ghost hidden md:flex items-center gap-2">
              Semua pengurus <ArrowUpRight size={13} />
            </Link>
          </div>

          {cabinet && (
            <p className="font-mono-code text-[9px] text-[#29abe2] tracking-[0.2em] mb-8">
              AKTIF · {cabinet.toUpperCase()}
            </p>
          )}

          {activeMembers.length > 0 ? (() => {
            const pimpinan = activeMembers.filter(m => {
              const r = m.role_position.toLowerCase();
              return (r.includes("ketua") || r.includes("kepala") || r.includes("wakil")) && !r.includes("koordinator") && !r.includes("koord");
            });
            const koordinator = activeMembers.filter(m => {
              const r = m.role_position.toLowerCase();
              return (r.includes("koordinator") || r.includes("koord")) && !r.includes("ketua") && !r.includes("wakil");
            });

            const HLinePreview = ({ delay = 0 }: { delay?: number }) => (
              <div className="org-line-h flex-1" style={{ animationDelay: `${delay}s` }} />
            );
            const VLinePreview = ({ delay = 0, height = "h-8" }: { delay?: number; height?: string }) => (
              <div className={`org-line-v ${height} mx-auto`} style={{ animationDelay: `${delay}s` }} />
            );
            const NodePreview = ({ bright = false, delay = 0 }: { bright?: boolean; delay?: number }) => (
              <div className={`org-node ${bright ? "org-node-bright" : ""} mx-auto`} style={{ animationDelay: `${delay}s` }} />
            );

            const MemberCardPreview = ({ m }: { m: OrganizationMember }) => (
              <article className="card-navy overflow-hidden group w-full">
                <div className="member-photo">
                  {m.photo_url
                    ? <Image src={m.photo_url} alt={m.name} fill sizes="(max-width:768px) 45vw, 15vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <span className="font-display font-bold text-3xl text-[#29abe2]">
                        {m.name.split(" ").map((x: string) => x[0]).slice(0, 2).join("")}
                      </span>
                  }
                  <div className="absolute inset-0 bg-[#29abe2] opacity-0 group-hover:opacity-[0.06] transition-opacity" />
                </div>
                <div className="p-3">
                  <h3 className="font-display font-semibold text-[13px] text-[#f0f6fc] mb-0.5 leading-tight">{m.name}</h3>
                  <p className="font-mono-code text-[9px] text-[#29abe2] tracking-wide">{m.role_position}</p>
                  {m.department && <p className="text-[10px] text-[#4d7a9e] mt-0.5">{m.department}</p>}
                </div>
              </article>
            );

            return (
              <div className="max-w-5xl mx-auto">
                {pimpinan.length > 0 && (
                  <div className="mb-4">
                    <p className="font-mono-code text-[9px] text-[#4d7a9e] tracking-widest text-center mb-6">PIMPINAN</p>
                    <div className={`grid gap-4 mx-auto ${
                      pimpinan.length === 1 ? "grid-cols-1 max-w-[160px]" :
                      pimpinan.length === 2 ? "grid-cols-2 max-w-[360px]" :
                      "grid-cols-3 max-w-[540px]"
                    }`}>
                      {pimpinan.map(m => <MemberCardPreview key={m.id} m={m} />)}
                    </div>

                    {koordinator.length > 0 && (
                      <div className="flex flex-col items-center mt-0">
                        <NodePreview bright delay={0} />
                        <VLinePreview height="h-10" delay={0.1} />
                        <NodePreview delay={0.2} />
                        {koordinator.length > 1 && (
                          <div className={`w-full flex items-center ${
                            koordinator.length === 2 ? "max-w-[360px]" :
                            koordinator.length === 3 ? "max-w-[540px]" :
                            koordinator.length <= 4 ? "max-w-[720px]" : "max-w-4xl"
                          }`}>
                            {koordinator.map((_, i) => (
                              <div key={i} className="flex items-center flex-1">
                                {i > 0 && <HLinePreview delay={0.3 + i * 0.1} />}
                                <NodePreview delay={0.3 + i * 0.1} />
                                {i < koordinator.length - 1 && <HLinePreview delay={0.4 + i * 0.1} />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {koordinator.length > 0 && (
                  <div className={`grid gap-4 mx-auto w-full ${
                    koordinator.length === 1 ? "grid-cols-1 max-w-[160px]" :
                    koordinator.length === 2 ? "grid-cols-2 max-w-[360px]" :
                    koordinator.length === 3 ? "grid-cols-3 max-w-[540px]" :
                    koordinator.length <= 4 ? "grid-cols-2 md:grid-cols-4 max-w-[720px]" :
                    "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  }`}>
                    {koordinator.map((m, idx) => (
                      <div key={m.id} className="flex flex-col items-center">
                        <VLinePreview height="h-6" delay={0.5 + idx * 0.1} />
                        <NodePreview delay={0.6 + idx * 0.1} />
                        <VLinePreview height="h-4" delay={0.7 + idx * 0.1} />
                        <p className="font-mono-code text-[8px] text-[#29abe2] tracking-widest mb-2 text-center">
                          {m.department?.toUpperCase() ?? "DIVISI"}
                        </p>
                        <div className="w-full">
                          <MemberCardPreview m={m} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="empty-state">
              Pengurus aktif akan tampil di sini.{" "}
              <Link href="/pengurus" className="text-[#29abe2] hover:underline">Jelajahi arsip</Link>
            </div>
          )}

          <div className="mt-6 flex md:hidden">
            <Link href="/pengurus" className="btn-ghost flex items-center gap-2">
              Semua pengurus <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ PROJECTS ═══ */}
      <section id="karya" className="px-[6%] py-16 md:py-24 bg-[#111e2a]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <div className="mono-label mb-4 flex items-center gap-3">
                ETALASE KARYA
              </div>
              <h2 className="font-display font-bold text-[clamp(28px,4vw,52px)] tracking-tight text-[#f0f6fc]">
                Ide yang jadi<br /><span className="text-[#29abe2]">nyata</span>
              </h2>
            </div>
            <Link href="/showcase" className="btn-ghost hidden md:flex items-center gap-2">
              Semua karya <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {latestProjects.map((p, i) => {
              const ACCENTS = ["#29abe2", "#3dbef5", "#b0c4d8"];
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <article key={p.id} className="card-navy group overflow-hidden">
                  <div className="relative h-[200px] bg-[#111e2a] overflow-hidden">
                    {p.thumbnail_url ? (
                      <Image src={p.thumbnail_url} alt={p.title} fill sizes="(max-width:768px) 90vw, 30vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <>
                        <div className="absolute inset-0 opacity-[0.12]" style={{ background: `radial-gradient(ellipse at 40% 50%, ${accent} 0%, transparent 70%)` }} />
                        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${accent}15 1px, transparent 1px), linear-gradient(90deg, ${accent}15 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
                        <div className="absolute top-3 left-4 font-mono-code text-[9px] tracking-widest" style={{ color: accent }}>WEB APP / {String(i + 1).padStart(2, "0")}</div>
                      </>
                    )}
                    <span className="absolute right-3 bottom-3 bg-[#111e2a]/80 backdrop-blur-sm px-2 py-0.5 rounded font-mono-code text-[9px]" style={{ color: accent }}>WEB APP</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-display font-bold text-[18px] text-[#f0f6fc]">{p.title}</h3>
                      {p.demo_url
                        ? <a href={p.demo_url} target="_blank" rel="noreferrer"><ArrowUpRight size={16} className="text-[#2d4a63] group-hover:text-[#29abe2] transition-colors shrink-0 mt-0.5" /></a>
                        : <ArrowUpRight size={16} className="text-[#2d4a63] group-hover:text-[#29abe2] transition-colors shrink-0 mt-0.5" />
                      }
                    </div>
                    <p className="text-[12px] text-[#7a9ab8] leading-[1.7]">{p.tagline ?? p.description}</p>
                  </div>
                </article>
              );
            })}
          </div>

          {latestProjects.length === 0 && (
            <div className="empty-state">Belum ada karya yang dipublikasikan.</div>
          )}

          <div className="mt-6 flex md:hidden">
            <Link href="/showcase" className="btn-ghost flex items-center gap-2">
              Semua karya <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ PKM PREVIEW ═══ */}
      <section id="pkm" className="px-[6%] py-16 md:py-24 bg-[#1e3040]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <div className="mono-label mb-4 flex items-center gap-3">
                PROGRAM KREATIVITAS MAHASISWA
              </div>
              <h2 className="font-display font-bold text-[clamp(28px,4vw,52px)] tracking-tight text-[#f0f6fc]">
                Ide yang<br /><span className="text-[#29abe2]">berdampak</span>
              </h2>
            </div>
            <Link href="/pkm" className="btn-ghost hidden md:flex items-center gap-2">
              Lihat semua PKM <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-[#2d4a63]">
            {latestPkm.map((p, i) => (
              <div key={p.id} className="grid grid-cols-[40px_1fr] gap-5 py-6 items-start group">
                <span className="font-mono-code text-[13px] text-[#29abe2] mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono-code text-[9px] tracking-wide bg-[#29abe215] border border-[#29abe230] text-[#29abe2] px-2 py-0.5 rounded-full">{p.scheme}</span>
                    <span className="font-mono-code text-[9px] text-[#4d7a9e]">Pendamping: {p.supervisor_name}</span>
                  </div>
                  <h3 className="font-display font-semibold text-[17px] text-[#f0f6fc]">{p.title}</h3>
                </div>
              </div>
            ))}
          </div>

          {latestPkm.length === 0 && (
            <div className="empty-state">Belum ada PKM yang dipublikasikan.</div>
          )}

          <div className="mt-6 flex md:hidden">
            <Link href="/pkm" className="btn-ghost flex items-center gap-2">
              Lihat semua PKM <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ BERITA ═══ */}
      <section id="berita" className="px-[6%] py-16 md:py-24 bg-[#111e2a]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-8 md:mb-12">
            <div>
              <div className="mono-label mb-4 flex items-center gap-3">
                BERITA &amp; KEGIATAN
              </div>
              <h2 className="font-display font-bold text-[clamp(28px,4vw,52px)] tracking-tight text-[#f0f6fc]">
                Selalu ada cerita<br /><span className="text-[#29abe2]">tiap minggunya</span>
              </h2>
            </div>
          </div>

          {news.length > 0 ? (
            <div className="relative">
              {/* Slider viewport */}
              <div className="overflow-hidden">
                <div
                  ref={sliderRef}
                  className="flex gap-5 transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(calc(-${newsIndex} * (${
                      slidesVisible === 1 ? "100% + 20px" :
                      slidesVisible === 2 ? "50% + 10px" :
                      "33.333% + 13.333px"
                    })))`
                  }}
                >
                  {news.map((item) => (
                    <a
                      key={item.id}
                      href={item.ig_url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex-shrink-0 w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] card-navy overflow-hidden hover:border-[#29abe2]/50 transition-all duration-300"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-[200px] bg-[#111e2a] overflow-hidden">
                        <Image
                          src={item.thumbnail_url}
                          alt={item.title}
                          fill
                          sizes="(max-width:640px) 90vw, (max-width:1024px) 45vw, 30vw"
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2 right-2 bg-[#111e2a]/80 backdrop-blur-sm px-2 py-0.5 rounded font-mono-code text-[9px] text-[#29abe2] flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                          Instagram
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono-code text-[9px] text-[#4d7a9e] tracking-widest">
                            {new Date(item.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          {item.category && (
                            <span className="font-mono-code text-[9px] bg-[#29abe215] border border-[#29abe230] text-[#29abe2] px-2 py-0.5 rounded-full">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display font-semibold text-[16px] text-[#f0f6fc] mb-2 leading-snug line-clamp-2 group-hover:text-[#29abe2] transition-colors">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="text-[12px] text-[#7a9ab8] leading-[1.7] line-clamp-2">{item.excerpt}</p>
                        )}
                        <div className="mt-3 flex items-center gap-1 text-[#29abe2] text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Lihat di Instagram <ExternalLink size={10} />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Nav arrows */}
              {news.length > slidesVisible && (
                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={prev}
                    disabled={newsIndex === 0}
                    className="w-9 h-9 rounded-full border border-[#2d4a63] bg-[#111e2a] grid place-items-center text-[#7a9ab8] hover:border-[#29abe2] hover:text-[#29abe2] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={next}
                    disabled={newsIndex >= maxIndex}
                    className="w-9 h-9 rounded-full border border-[#2d4a63] bg-[#111e2a] grid place-items-center text-[#7a9ab8] hover:border-[#29abe2] hover:text-[#29abe2] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                  {/* Dots */}
                  <div className="flex gap-1.5 ml-2">
                    {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setNewsIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === newsIndex ? "w-5 bg-[#29abe2]" : "w-1.5 bg-[#2d4a63]"}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              Belum ada berita yang dipublikasikan.
            </div>
          )}

        </div>
      </section>

      {/* ═══ PROGRAMS ═══ */}
      <section id="belajar" className="px-[6%] py-16 md:py-24 bg-[#1e3040]">
        <div className="max-w-6xl mx-auto">
          <div className="mono-label mb-4 flex items-center gap-3">
            CARA KAMI BERTUMBUH
          </div>
          <h2 className="font-display font-bold text-[clamp(28px,4vw,52px)] tracking-tight text-[#f0f6fc] mb-10 md:mb-14">
            Belajar lewat<br /><span className="text-[#29abe2]">hal yang kita buat</span>
          </h2>

          <div className="divide-y divide-[#2d4a63]">
            {[
              { icon: <Code2 size={20} />, badge: "MINGGU GANJIL", title: "Programming", desc: "Sesi coding bareng mingguan. Mulai dari dasar web, logika pemrograman, hingga membangun produk nyata bersama." },
              { icon: <Lightbulb size={20} />, badge: "MINGGU GENAP", title: "Riset", desc: "Eksplorasi topik riset teknologi informasi. Dari membaca paper, diskusi ide, hingga menyusun karya ilmiah." },
            ].map((item, i) => (
              <div key={i} className="flex items-start md:items-center gap-4 md:gap-6 py-6 md:py-7 group cursor-default">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg border border-[#2d4a63] bg-[#243649] grid place-items-center text-[#29abe2] shrink-0 group-hover:border-[#29abe2] group-hover:shadow-cyan-sm transition-all">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <span className="font-mono-code text-[9px] text-[#4d7a9e] tracking-widest block mb-1">{item.badge}</span>
                  <h3 className="font-display font-semibold text-[16px] md:text-[18px] text-[#f0f6fc] mb-1">{item.title}</h3>
                  <p className="text-[13px] text-[#7a9ab8]">{item.desc}</p>
                </div>
                <span className="text-[#2d4a63] group-hover:text-[#29abe2] transition-colors text-xl font-light hidden md:block">↗</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ JOIN CTA ═══ */}
      <section id="gabung" className="relative px-[6%] py-20 md:py-28 bg-[#111e2a] overflow-hidden text-center">
        <div className="glow-orb w-[600px] h-[400px] bg-[#29abe2] opacity-[0.06] left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
        <div className="grid-bg opacity-20" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="mono-label mb-6 flex items-center justify-center gap-3">
            <span className="w-5 h-px bg-[#29abe2]" />
            BERGABUNG BERSAMA KAMI
            <span className="w-5 h-px bg-[#29abe2]" />
          </div>
          <h2 className="font-display font-extrabold text-[clamp(32px,5.5vw,72px)] tracking-tight text-[#f0f6fc] mb-5 leading-[1.0]">
            Yuk, tumbuh<br />
            <span className="text-gradient">bareng kita</span>
          </h2>
          <p className="text-[14px] text-[#7a9ab8] mb-9 leading-[1.8]">
            Nggak perlu jago dulu buat ikut. Di FoRTI, kamu belajar sambil jalan, bareng orang-orang yang juga lagi tumbuh.
          </p>
          <a href="https://www.instagram.com/forti_harkatnegeri/" target="_blank" rel="noreferrer" className="btn-primary text-[14px] px-6 py-3 inline-flex">
            Ikuti kami di Instagram <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="scan-line" />
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#2d4a63] bg-[#111e2a]">
        <div className="px-[6%] py-8 flex flex-col items-center gap-5 md:flex-row md:justify-between">
          <a href="#home" className="flex items-center gap-3">
            <span className="brand-mark">
              <Image src="/images/forti-logo.jpg" alt="" fill sizes="36px" className="object-cover" />
            </span>
            <span className="font-display font-bold text-[15px] text-[#f0f6fc]">
              FoRTI
              <span className="block font-mono-code text-[8px] font-normal tracking-[0.18em] text-[#29abe2]">FORUM RISET TI</span>
            </span>
          </a>
          <div className="w-16 h-px bg-[#2d4a63] md:hidden" />
          <div className="flex items-center gap-5">
            <span className="font-mono-code text-[9px] text-[#2d4a63]">© 2026 FoRTI</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
