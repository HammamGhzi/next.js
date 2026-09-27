-- ============================================================
-- FORTI Study Club – Schema Final
-- Jalankan seluruh skrip ini di Supabase SQL Editor
-- ============================================================

-- 0. Ekstensi
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ENUM Types
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role      AS ENUM ('student', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('draft', 'pending', 'published', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pkm_status     AS ENUM ('submitted', 'under_review', 'verified', 'published', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE member_role    AS ENUM ('leader', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. Profil Pengguna
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL,
  nim         TEXT,
  faculty     TEXT,
  email       TEXT,
  role        user_role   NOT NULL DEFAULT 'student'::user_role,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. Kepengurusan Organisasi (Dinamis Tahunan)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.periods (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  cabinet_name  TEXT    NOT NULL,
  year_start    INT     NOT NULL,
  year_end      INT     NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id      UUID    NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  name           TEXT    NOT NULL,
  role_position  TEXT    NOT NULL,
  department     TEXT    NOT NULL,
  photo_url      TEXT,
  display_order  INT     NOT NULL DEFAULT 99,
  linkedin_url   TEXT,
  instagram_url  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_members_period ON public.organization_members(period_id);

-- ============================================================
-- 4. Tim & Anggota Mahasiswa
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  team_name        TEXT NOT NULL,
  contact_wa       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role  member_role NOT NULL DEFAULT 'member'::member_role,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team    ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_profile ON public.team_members(profile_id);

-- ============================================================
-- 5. Final Project (Pameran Karya)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.final_projects (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        UUID           REFERENCES public.teams(id) ON DELETE SET NULL,
  submitted_by   UUID           NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title          TEXT           NOT NULL,
  tagline        TEXT,
  category       TEXT           NOT NULL,
  description    TEXT           NOT NULL,
  tech_stack     TEXT[]         NOT NULL DEFAULT '{}',
  thumbnail_url  TEXT,
  demo_url       TEXT           NOT NULL,
  repo_url       TEXT,
  status         project_status NOT NULL DEFAULT 'pending'::project_status,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fp_status      ON public.final_projects(status);
CREATE INDEX IF NOT EXISTS idx_fp_submitted_by ON public.final_projects(submitted_by);

-- ============================================================
-- 6. Submisi PKM Final (Repositori)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pkm_submissions (
  id                  UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id             UUID       REFERENCES public.teams(id) ON DELETE SET NULL,
  submitted_by        UUID       NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  scheme              TEXT       NOT NULL,
  title               TEXT       NOT NULL,
  abstract            TEXT,
  supervisor_name     TEXT       NOT NULL,
  drive_proposal_url  TEXT       NOT NULL,
  status              pkm_status NOT NULL DEFAULT 'submitted'::pkm_status,
  submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pkm_status ON public.pkm_submissions(status);

-- ============================================================
-- 7. Tabel Berita / News Posts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.news_posts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  excerpt        TEXT,
  thumbnail_url  TEXT        NOT NULL,
  ig_url         TEXT        NOT NULL,
  category       TEXT,
  published      BOOLEAN     NOT NULL DEFAULT false,
  published_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON public.news_posts(published, published_at DESC);

-- RLS: publik baca yang published, admin bisa semua
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "news_public_read"  ON public.news_posts;
DROP POLICY IF EXISTS "news_admin_all"    ON public.news_posts;

CREATE POLICY "news_public_read" ON public.news_posts
  FOR SELECT USING (published = true);

CREATE POLICY "news_admin_all" ON public.news_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================================
-- 8. Trigger: Buat Profil Otomatis saat User Baru Daftar
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, nim, faculty, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Mahasiswa FORTI'),
    NEW.email,
    NEW.raw_user_meta_data->>'nim',
    NEW.raw_user_meta_data->>'faculty',
    'student'::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 8. Fungsi: Invite Anggota Tim via Email
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_team_member_by_email(
  team_uuid    UUID,
  member_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile       public.profiles%ROWTYPE;
  v_team          public.teams%ROWTYPE;
  v_caller_id     UUID := auth.uid();
BEGIN
  -- Ambil data tim
  SELECT * INTO v_team FROM public.teams WHERE id = team_uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tim tidak ditemukan.');
  END IF;

  -- Pastikan yang memanggil adalah ketua tim
  IF v_team.leader_id <> v_caller_id THEN
    RETURN jsonb_build_object('error', 'Hanya ketua tim yang dapat mengundang anggota.');
  END IF;

  -- Cari profil berdasarkan email
  SELECT * INTO v_profile FROM public.profiles WHERE email = member_email LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Akun dengan email tersebut belum terdaftar di FORTI.');
  END IF;

  -- Cegah duplikat
  IF EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_uuid AND profile_id = v_profile.id) THEN
    RETURN jsonb_build_object('error', 'Pengguna tersebut sudah menjadi anggota tim.');
  END IF;

  -- Tambahkan anggota
  INSERT INTO public.team_members (team_id, profile_id, member_role)
  VALUES (team_uuid, v_profile.id, 'member');

  RETURN jsonb_build_object('success', true, 'member_name', v_profile.full_name);
END;
$$;

-- ============================================================
-- 9. Row Level Security (RLS)
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all"   ON public.profiles;

CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all"   ON public.profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- periods (publik read, admin write)
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "periods_public_read"  ON public.periods;
DROP POLICY IF EXISTS "periods_admin_write"  ON public.periods;

CREATE POLICY "periods_public_read" ON public.periods FOR SELECT USING (true);
CREATE POLICY "periods_admin_write" ON public.periods FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- organization_members (publik read, admin write)
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_members_public_read"  ON public.organization_members;
DROP POLICY IF EXISTS "org_members_admin_write"  ON public.organization_members;

CREATE POLICY "org_members_public_read" ON public.organization_members FOR SELECT USING (true);
CREATE POLICY "org_members_admin_write" ON public.organization_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teams_select_member" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_auth"   ON public.teams;
DROP POLICY IF EXISTS "teams_update_leader" ON public.teams;

CREATE POLICY "teams_select_member" ON public.teams FOR SELECT
  USING (
    leader_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = id AND tm.profile_id = auth.uid())
  );
CREATE POLICY "teams_insert_auth"   ON public.teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "teams_update_leader" ON public.teams FOR UPDATE USING (leader_id = auth.uid());

-- team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_leader" ON public.team_members;

CREATE POLICY "team_members_select" ON public.team_members FOR SELECT
  USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.leader_id = auth.uid())
  );
CREATE POLICY "team_members_insert_leader" ON public.team_members FOR INSERT
  WITH CHECK (
    -- Hanya ketua tim (leader_id) yang boleh menambahkan anggota langsung via tabel
    -- Insert dari RPC add_team_member_by_email sudah diverifikasi di fungsi (SECURITY DEFINER)
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.leader_id = auth.uid()
    )
  );

-- final_projects (publik baca yang published, owner/admin bisa semua)
ALTER TABLE public.final_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fp_public_read"      ON public.final_projects;
DROP POLICY IF EXISTS "fp_owner_insert"     ON public.final_projects;
DROP POLICY IF EXISTS "fp_owner_update"     ON public.final_projects;
DROP POLICY IF EXISTS "fp_admin_all"        ON public.final_projects;

CREATE POLICY "fp_public_read"  ON public.final_projects FOR SELECT USING (status = 'published');
CREATE POLICY "fp_owner_insert" ON public.final_projects FOR INSERT WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "fp_owner_update" ON public.final_projects FOR UPDATE USING (submitted_by = auth.uid() AND status = 'draft');
CREATE POLICY "fp_admin_all"    ON public.final_projects FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- pkm_submissions (publik baca yang published, owner/admin bisa semua)
ALTER TABLE public.pkm_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pkm_public_read"   ON public.pkm_submissions;
DROP POLICY IF EXISTS "pkm_owner_insert"  ON public.pkm_submissions;
DROP POLICY IF EXISTS "pkm_admin_all"     ON public.pkm_submissions;

CREATE POLICY "pkm_public_read"  ON public.pkm_submissions FOR SELECT USING (status = 'published');
CREATE POLICY "pkm_owner_insert" ON public.pkm_submissions FOR INSERT WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "pkm_admin_all"    ON public.pkm_submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================
-- 10. Storage Buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-photos', 'organization-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: organization-photos
DROP POLICY IF EXISTS "org_photos_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "org_photos_admin_upload" ON storage.objects;

CREATE POLICY "org_photos_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'organization-photos');

CREATE POLICY "org_photos_admin_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'organization-photos' AND
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "org_photos_admin_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'organization-photos' AND
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Storage policies: project-assets
DROP POLICY IF EXISTS "project_assets_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "project_assets_auth_upload"  ON storage.objects;

CREATE POLICY "project_assets_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'project-assets');

CREATE POLICY "project_assets_auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-assets' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "project_assets_owner_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-assets' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- ============================================================
-- 11. Tambahan: Policy agar owner bisa baca submisi sendiri
-- ============================================================
CREATE POLICY "fp_owner_read_own" ON public.final_projects FOR SELECT
  USING (submitted_by = auth.uid());

CREATE POLICY "pkm_owner_read_own" ON public.pkm_submissions FOR SELECT
  USING (submitted_by = auth.uid());

-- ============================================================
-- SELESAI.
-- Setelah menjalankan ini:
-- 1. Promosikan admin pertama:
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'email-kamu@example.com';
-- 2. Aktifkan Google OAuth di Supabase Auth jika diperlukan.
-- ============================================================
