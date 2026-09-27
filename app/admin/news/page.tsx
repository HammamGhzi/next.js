"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import {
  ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff,
  ExternalLink, X, Check, Loader2, Upload, ImageIcon,
} from "lucide-react";
import { supabase, NewsPost } from "@/lib/supabase";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
type FormState = {
  title: string;
  excerpt: string;
  ig_url: string;
  category: string;
  published: boolean;
  published_at: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  excerpt: "",
  ig_url: "",
  category: "",
  published: false,
  published_at: new Date().toISOString().slice(0, 16),
};

export default function AdminNewsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<NewsPost[]>([]);

  // form state
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [existingThumb, setExistingThumb] = useState<string | null>(null); // URL foto yg sudah ada (mode edit)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);       // preview file baru
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Auth guard ──────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) { router.replace("/dashboard"); return; }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      const { data: profile } = await supabase!
        .from("profiles").select("role").eq("id", data.user.id).single();
      if (profile?.role !== "admin") { router.replace("/dashboard"); return; }
      fetchPosts();
    });
  }, [router]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch ───────────────────────────────────────────────────
  const fetchPosts = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("news_posts")
      .select("*")
      .order("published_at", { ascending: false });
    setPosts((data ?? []) as NewsPost[]);
    setLoading(false);
  };

  // ── Handle file pick ────────────────────────────────────────
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // preview lokal
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setImageFile(file);
  };

  // ── Upload gambar ke storage ─────────────────────────────────
  const uploadImage = async (file: File): Promise<string> => {
    if (!supabase) throw new Error("Supabase tidak terkonfigurasi.");
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    });
    const ext = compressed.name.split(".").pop() ?? "jpg";
    const path = `news/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("project-assets")
      .upload(path, compressed, { upsert: false, contentType: compressed.type });
    if (error) throw error;
    return supabase.storage.from("project-assets").getPublicUrl(path).data.publicUrl;
  };

  // ── Save (insert/update) ────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    // Validasi wajib
    if (!form.title.trim()) { showToast("Judul wajib diisi.", false); return; }
    if (!form.ig_url.trim()) { showToast("Link Instagram wajib diisi.", false); return; }
    if (!editId && !imageFile) { showToast("Gambar berita wajib diunggah.", false); return; }

    setSaving(true);
    try {
      // Upload gambar jika ada file baru
      let thumbnail_url = existingThumb ?? "";
      if (imageFile) {
        thumbnail_url = await uploadImage(imageFile);
      }

      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || null,
        thumbnail_url,
        ig_url: form.ig_url.trim(),
        category: form.category.trim() || null,
        published: form.published,
        published_at: form.published_at
          ? new Date(form.published_at).toISOString()
          : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editId) {
        ({ error } = await supabase.from("news_posts").update(payload).eq("id", editId));
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        ({ error } = await supabase.from("news_posts").insert({
          ...payload,
          created_by: user?.id ?? null,
        }));
      }

      if (error) throw error;
      showToast(editId ? "Berita diperbarui." : "Berita ditambahkan.");
      resetForm();
      fetchPosts();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menyimpan.", false);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!supabase || !confirm("Hapus berita ini?")) return;
    setDeleting(id);
    const { error } = await supabase.from("news_posts").delete().eq("id", id);
    setDeleting(null);
    if (error) showToast(`Gagal hapus: ${error.message}`, false);
    else { showToast("Berita dihapus."); fetchPosts(); }
  };

  // ── Toggle publish ──────────────────────────────────────────
  const togglePublish = async (post: NewsPost) => {
    if (!supabase) return;
    await supabase
      .from("news_posts")
      .update({ published: !post.published, updated_at: new Date().toISOString() })
      .eq("id", post.id);
    fetchPosts();
  };

  // ── Form helpers ────────────────────────────────────────────
  const openEdit = (post: NewsPost) => {
    setEditId(post.id);
    setForm({
      title: post.title,
      excerpt: post.excerpt ?? "",
      ig_url: post.ig_url,
      category: post.category ?? "",
      published: post.published,
      published_at: post.published_at.slice(0, 16),
    });
    setExistingThumb(post.thumbnail_url);
    setPreviewUrl(post.thumbnail_url);
    setImageFile(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, published_at: new Date().toISOString().slice(0, 16) });
    setExistingThumb(null);
    setPreviewUrl(null);
    setImageFile(null);
    setShowForm(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const f = (field: keyof FormState, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // ── UI ───────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#1e3040] text-[#f0f6fc] px-[5%] py-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-[13px] font-medium transition-all ${
          toast.ok ? "bg-[#1a8cc4] text-white" : "bg-red-600 text-white"
        }`}>
          {toast.ok ? <Check size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/kepengurusan" className="text-[#4d7a9e] hover:text-[#29abe2] transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="font-mono-code text-[9px] text-[#29abe2] tracking-widest mb-1">ADMIN PANEL</div>
            <h1 className="font-display font-bold text-[22px]">Manajemen Berita</h1>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="ml-auto btn-primary text-[12px] px-4 py-2.5 flex items-center gap-2"
          >
            <Plus size={14} /> Tambah Berita
          </button>
        </div>

        {/* ── FORM ─────────────────────────────────────────────── */}
        {showForm && (
          <div className="card-navy p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-[17px]">
                {editId ? "Edit Berita" : "Tambah Berita Baru"}
              </h2>
              <button onClick={resetForm} className="text-[#4d7a9e] hover:text-[#f0f6fc] transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* ── Upload Gambar (wajib) ── */}
                <div className="md:col-span-2">
                  <label className="label-field">
                    Gambar Berita *{editId ? " (biarkan kosong jika tidak ingin mengubah)" : ""}
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-colors overflow-hidden ${
                      previewUrl
                        ? "border-[#29abe2]/40 hover:border-[#29abe2]"
                        : "border-[#2d4a63] hover:border-[#29abe2]/60"
                    }`}
                    style={{ height: previewUrl ? "220px" : "140px" }}
                  >
                    {previewUrl ? (
                      <>
                        <Image
                          src={previewUrl}
                          alt="preview"
                          fill
                          className="object-cover"
                        />
                        {/* Overlay hint */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-[12px] font-medium">
                          <Upload size={16} /> Ganti Gambar
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-[#4d7a9e]">
                        <ImageIcon size={28} />
                        <span className="text-[12px]">Klik untuk pilih gambar</span>
                        <span className="font-mono-code text-[9px] tracking-wide">JPG / PNG / WEBP · maks. 5 MB</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFilePick}
                  />
                  {imageFile && (
                    <p className="font-mono-code text-[9px] text-[#29abe2] mt-1.5 tracking-wide">
                      {imageFile.name} · {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>

                {/* Judul */}
                <div className="md:col-span-2">
                  <label className="label-field">Judul Berita *</label>
                  <input
                    className="input-field w-full"
                    placeholder="Contoh: Workshop Pemrograman Web 2026"
                    value={form.title}
                    onChange={e => f("title", e.target.value)}
                    required
                  />
                </div>

                {/* Link IG */}
                <div>
                  <label className="label-field">Link Post Instagram *</label>
                  <input
                    className="input-field w-full"
                    placeholder="https://www.instagram.com/p/..."
                    value={form.ig_url}
                    onChange={e => f("ig_url", e.target.value)}
                    required
                    type="url"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="label-field">Kategori (opsional)</label>
                  <input
                    className="input-field w-full"
                    placeholder="Contoh: Workshop, Lomba, Kegiatan"
                    value={form.category}
                    onChange={e => f("category", e.target.value)}
                  />
                </div>

                {/* Tanggal */}
                <div>
                  <label className="label-field">Tanggal Publikasi</label>
                  <input
                    className="input-field w-full"
                    type="datetime-local"
                    value={form.published_at}
                    onChange={e => f("published_at", e.target.value)}
                  />
                </div>

                {/* Published toggle */}
                <div className="flex items-center gap-3 self-end pb-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.published}
                      onChange={e => f("published", e.target.checked)}
                    />
                    <div className="w-10 h-5 bg-[#2d4a63] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#29abe2]" />
                  </label>
                  <span className="text-[13px] text-[#b0c4d8]">
                    {form.published ? "Langsung dipublikasikan" : "Simpan sebagai draft"}
                  </span>
                </div>

                {/* Excerpt */}
                <div className="md:col-span-2">
                  <label className="label-field">Ringkasan (opsional)</label>
                  <textarea
                    className="input-field w-full resize-none"
                    rows={3}
                    placeholder="Deskripsi singkat yang muncul di card..."
                    value={form.excerpt}
                    onChange={e => f("excerpt", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-[12px] px-5 py-2.5 flex items-center gap-2 disabled:opacity-60"
                >
                  {saving
                    ? <><Loader2 size={14} className="animate-spin" /> Menyimpan…</>
                    : <><Check size={14} /> {editId ? "Simpan Perubahan" : "Tambahkan"}</>
                  }
                </button>
                <button type="button" onClick={resetForm} className="btn-ghost text-[12px] px-5 py-2.5">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── LIST ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#29abe2]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            Belum ada berita. Klik <span className="text-[#29abe2]">Tambah Berita</span> untuk mulai.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-mono-code text-[9px] text-[#4d7a9e] tracking-widest mb-2">
              {posts.length} BERITA
            </p>
            {posts.map(post => (
              <div key={post.id} className="card-navy flex items-start gap-4 p-4">
                {/* Thumbnail */}
                <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-[#111e2a] shrink-0 border border-[#2d4a63]">
                  {post.thumbnail_url ? (
                    <Image
                      src={post.thumbnail_url}
                      alt={post.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid place-items-center h-full">
                      <ImageIcon size={18} className="text-[#2d4a63]" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-mono-code text-[9px] px-2 py-0.5 rounded-full border ${
                      post.published
                        ? "bg-[#29abe215] border-[#29abe230] text-[#29abe2]"
                        : "bg-[#2d4a63]/30 border-[#2d4a63] text-[#4d7a9e]"
                    }`}>
                      {post.published ? "PUBLISHED" : "DRAFT"}
                    </span>
                    {post.category && (
                      <span className="font-mono-code text-[9px] text-[#4d7a9e] tracking-wide">{post.category}</span>
                    )}
                    <span className="font-mono-code text-[9px] text-[#4d7a9e]">
                      {new Date(post.published_at).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-[15px] text-[#f0f6fc] truncate">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-[11px] text-[#7a9ab8] mt-0.5 line-clamp-1">{post.excerpt}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={post.ig_url}
                    target="_blank"
                    rel="noreferrer"
                    title="Buka di Instagram"
                    className="w-8 h-8 grid place-items-center rounded-lg text-[#4d7a9e] hover:text-[#29abe2] hover:bg-[#29abe210] transition-all"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    title={post.published ? "Sembunyikan" : "Publikasikan"}
                    onClick={() => togglePublish(post)}
                    className="w-8 h-8 grid place-items-center rounded-lg text-[#4d7a9e] hover:text-[#29abe2] hover:bg-[#29abe210] transition-all"
                  >
                    {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    title="Edit"
                    onClick={() => openEdit(post)}
                    className="w-8 h-8 grid place-items-center rounded-lg text-[#4d7a9e] hover:text-[#29abe2] hover:bg-[#29abe210] transition-all"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    title="Hapus"
                    onClick={() => handleDelete(post.id)}
                    disabled={deleting === post.id}
                    className="w-8 h-8 grid place-items-center rounded-lg text-[#4d7a9e] hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40"
                  >
                    {deleting === post.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
