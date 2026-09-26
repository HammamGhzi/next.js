"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { isSupabaseConfigured, OrganizationMember, Period, supabase } from "@/lib/supabase";
import { PageFrame, PageIntro, SupabaseNotice } from "@/app/components";

/* ─── Helper pengelompokan ─── */
function isKetua(role: string) {
  const r = role.toLowerCase();
  return (r.includes("ketua") || r.includes("kepala")) && !r.includes("wakil") && !r.includes("koordinator");
}
function isWakil(role: string) {
  return role.toLowerCase().includes("wakil");
}
function isKoordinator(role: string) {
  const r = role.toLowerCase();
  return r.includes("koordinator") || r.includes("koord");
}

interface DivisiGroup {
  koordinator: OrganizationMember;
  anggota: OrganizationMember[];
}
interface Grouped {
  pimpinan: OrganizationMember[];
  divisi: DivisiGroup[];
  lainnya: OrganizationMember[];
}

function groupMembers(members: OrganizationMember[]): Grouped {
  const pimpinan = members.filter(m => isKetua(m.role_position) || isWakil(m.role_position));
  const koordinators = members.filter(m => isKoordinator(m.role_position));
  const anggota = members.filter(m =>
    !isKetua(m.role_position) && !isWakil(m.role_position) && !isKoordinator(m.role_position)
  );
  const divisi: DivisiGroup[] = koordinators.map(k => ({
    koordinator: k,
    anggota: anggota.filter(a => a.department && k.department && a.department === k.department),
  }));
  const matched = new Set(divisi.flatMap(d => d.anggota.map(a => a.id)));
  const lainnya = anggota.filter(a => !matched.has(a.id));
  return { pimpinan, divisi, lainnya };
}

/* ─── Member Card — ukuran seragam ─── */
function MemberCard({ m }: { m: OrganizationMember }) {
  return (
    <article className="card-navy overflow-hidden group w-full">
      <div className="member-photo">
        {m.photo_url
          ? <Image src={m.photo_url} alt={m.name} fill sizes="(max-width:768px) 45vw, 15vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500" />
          : <span className="font-display font-bold text-3xl text-[#29abe2]">
              {m.name.split(" ").map(x => x[0]).slice(0, 2).join("")}
            </span>
        }
        <div className="absolute inset-0 bg-[#29abe2] opacity-0 group-hover:opacity-[0.06] transition-opacity" />
      </div>
      <div className="p-3">
        <h3 className="font-display font-semibold text-[13px] text-[#f0f6fc] mb-0.5 leading-tight">{m.name}</h3>
        <p className="font-mono-code text-[9px] text-[#29abe2] tracking-wide">{m.role_position}</p>
        {m.department && <p className="text-[10px] text-[#4d7a9e] mt-0.5">{m.department}</p>}
        {(m.linkedin_url || m.instagram_url) && (
          <div className="flex gap-3 mt-2">
            {m.linkedin_url && <a href={m.linkedin_url} target="_blank" rel="noreferrer" className="font-mono-code text-[9px] text-[#4d7a9e] hover:text-[#29abe2] transition-colors">LI ↗</a>}
            {m.instagram_url && <a href={m.instagram_url} target="_blank" rel="noreferrer" className="font-mono-code text-[9px] text-[#4d7a9e] hover:text-[#29abe2] transition-colors">IG ↗</a>}
          </div>
        )}
      </div>
    </article>
  );
}

/* ─── Connector line dengan efek cahaya ─── */
function HLine({ delay = 0 }: { delay?: number }) {
  return (
    <div className="org-line-h flex-1" style={{ animationDelay: `${delay}s` }} />
  );
}
function VLine({ delay = 0, height = "h-8" }: { delay?: number; height?: string }) {
  return (
    <div className={`org-line-v ${height} mx-auto`} style={{ animationDelay: `${delay}s` }} />
  );
}
function Node({ bright = false, delay = 0 }: { bright?: boolean; delay?: number }) {
  return (
    <div className={`org-node ${bright ? "org-node-bright" : ""} mx-auto`}
      style={{ animationDelay: `${delay}s` }} />
  );
}

export default function PengurusPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data: ps } = await supabase!.from("periods").select("*").order("year_start", { ascending: false });
      const list = (ps ?? []) as Period[];
      setPeriods(list);
      const active = list.find(p => p.is_active) ?? list[0];
      if (active) { setPeriodId(active.id); await load(active.id); }
      setLoading(false);
    })();
  }, []);

  async function load(id: string) {
    if (!supabase) return;
    const { data } = await supabase.from("organization_members").select("*").eq("period_id", id).order("display_order");
    setMembers((data ?? []) as OrganizationMember[]);
  }

  async function changePeriod(id: string) { setPeriodId(id); await load(id); }

  const active = periods.find(p => p.id === periodId);
  const { pimpinan, divisi, lainnya } = groupMembers(members);

  return (
    <PageFrame>
      <PageIntro
        number="01"
        label="KELUARGA FORTI"
        title={<>Orang-orang di balik<br /><span className="text-[#29abe2]">setiap kemungkinan.</span></>}
        description="Kenali pengurus aktif dan lihat perjalanan kepengurusan FoRTI dari tahun ke tahun."
      />
      <section className="px-[6%] py-16 min-h-[400px]">
        <SupabaseNotice />

        {/* Period selector */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-5 mb-12">
          <div>
            <p className="font-mono-code text-[9px] text-[#29abe2] tracking-[0.2em] mb-2">PERIODE / KEPENGURUSAN</p>
            <h2 className="font-display font-bold text-[28px] text-[#f0f6fc] tracking-tight">
              {active?.cabinet_name ?? "Kabinet FoRTI"}
            </h2>
          </div>
          {periods.length > 1 && (
            <select value={periodId} onChange={e => changePeriod(e.target.value)} className="field-input w-auto min-w-[220px]">
              {periods.map(p => <option key={p.id} value={p.id}>{p.cabinet_name} · {p.year_start}/{p.year_end}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <p className="text-center text-[13px] text-[#4d7a9e] py-12">Memuat pengurus…</p>
        ) : members.length === 0 ? (
          <div className="empty-state">
            {isSupabaseConfigured ? "Data kepengurusan belum diisi." : "Susunan pengurus tampil setelah Supabase dikonfigurasi."}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">

            {/* ══ PIMPINAN ══ */}
            {pimpinan.length > 0 && (
              <div className="mb-4">
                <p className="font-mono-code text-[9px] text-[#4d7a9e] tracking-widest text-center mb-6">PIMPINAN</p>
                {/* Cards pimpinan — di tengah, max 3 kolom */}
                <div className={`grid gap-4 mx-auto ${
                  pimpinan.length === 1 ? "grid-cols-1 max-w-[160px]" :
                  pimpinan.length === 2 ? "grid-cols-2 max-w-[360px]" :
                  "grid-cols-3 max-w-[540px]"
                }`}>
                  {pimpinan.map(m => <MemberCard key={m.id} m={m} />)}
                </div>

                {/* Garis turun ke divisi */}
                {divisi.length > 0 && (
                  <div className="flex flex-col items-center mt-0">
                    <Node bright delay={0} />
                    <VLine height="h-10" delay={0.1} />
                    <Node delay={0.2} />
                    {/* Garis horizontal penghubung semua divisi */}
                    {divisi.length > 1 && (
                      <div className={`w-full flex items-center ${
                        divisi.length === 2 ? "max-w-[360px]" :
                        divisi.length === 3 ? "max-w-[540px]" :
                        divisi.length <= 4 ? "max-w-[720px]" : "max-w-4xl"
                      }`}>
                        {divisi.map((_, i) => (
                          <div key={i} className="flex items-center flex-1">
                            {i > 0 && <HLine delay={0.3 + i * 0.1} />}
                            <Node delay={0.3 + i * 0.1} />
                            {i < divisi.length - 1 && <HLine delay={0.4 + i * 0.1} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ DIVISI ══ */}
            {divisi.length > 0 && (
              <div className={`grid gap-4 mx-auto w-full ${
                divisi.length === 1 ? "grid-cols-1 max-w-[160px]" :
                divisi.length === 2 ? "grid-cols-2 max-w-[360px]" :
                divisi.length === 3 ? "grid-cols-3 max-w-[540px]" :
                divisi.length <= 4 ? "grid-cols-2 md:grid-cols-4 max-w-[720px]" :
                "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              }`}>
                {divisi.map(({ koordinator, anggota }, idx) => (
                  <div key={koordinator.id} className="flex flex-col items-center">
                    {/* Garis turun dari connector ke card */}
                    <VLine height="h-6" delay={0.5 + idx * 0.1} />
                    <Node delay={0.6 + idx * 0.1} />
                    <VLine height="h-4" delay={0.7 + idx * 0.1} />

                    {/* Label divisi */}
                    <p className="font-mono-code text-[8px] text-[#29abe2] tracking-widest mb-2 text-center">
                      {koordinator.department?.toUpperCase() ?? "DIVISI"}
                    </p>

                    {/* Card koordinator */}
                    <div className="w-full">
                      <MemberCard m={koordinator} />
                    </div>

                    {/* Garis ke anggota */}
                    {anggota.length > 0 && (
                      <>
                        <VLine height="h-4" delay={0.8 + idx * 0.1} />
                        <Node delay={0.9 + idx * 0.1} />
                        <p className="font-mono-code text-[8px] text-[#4d7a9e] tracking-widest my-2">ANGGOTA</p>
                        <div className="grid grid-cols-1 gap-2 w-full">
                          {anggota.map(a => <MemberCard key={a.id} m={a} />)}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ══ LAINNYA ══ */}
            {lainnya.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                  <HLine delay={0} />
                  <span className="font-mono-code text-[9px] text-[#4d7a9e] tracking-widest whitespace-nowrap">ANGGOTA LAINNYA</span>
                  <HLine delay={0.2} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {lainnya.map(m => <MemberCard key={m.id} m={m} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </PageFrame>
  );
}
