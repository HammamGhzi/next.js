import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

/** Singleton Supabase client — null bila .env.local belum diisi */
export const supabase = isSupabaseConfigured
  ? createClient(url!, key!)
  : null;

// ──────────────────────────────────────────────────────────────
// Types sesuai schema final
// ──────────────────────────────────────────────────────────────

export type UserRole = "student" | "admin";
export type ProjectStatus = "draft" | "pending" | "published" | "rejected";
export type PkmStatus =
  | "submitted"
  | "under_review"
  | "verified"
  | "published"
  | "rejected";
export type MemberRole = "leader" | "member";

export interface Profile {
  id: string;
  full_name: string;
  nim: string | null;
  faculty: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Period {
  id: string;
  cabinet_name: string;
  year_start: number;
  year_end: number;
  is_active: boolean;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  period_id: string;
  name: string;
  role_position: string;
  department: string;
  photo_url: string | null;
  display_order: number;
  linkedin_url: string | null;
  instagram_url: string | null;
  created_at: string;
}

/** @deprecated Gunakan OrganizationMember */
export type Member = OrganizationMember;

export interface Team {
  id: string;
  leader_id: string;
  team_name: string;
  contact_wa: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  profile_id: string;
  member_role: MemberRole;
  created_at: string;
}

export interface FinalProject {
  id: string;
  team_id: string | null;
  submitted_by: string;
  title: string;
  tagline: string | null;
  category: string;
  description: string;
  tech_stack: string[];
  thumbnail_url: string | null;
  demo_url: string;
  repo_url: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface PkmSubmission {
  id: string;
  team_id: string | null;
  submitted_by: string;
  scheme: string;
  title: string;
  abstract: string | null;
  supervisor_name: string;
  drive_proposal_url: string;
  status: PkmStatus;
  submitted_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Mengembalikan label status yang ramah pengguna.
 */
export function statusLabel(status: ProjectStatus | PkmStatus): string {
  const map: Record<string, string> = {
    draft: "Draft",
    pending: "Menunggu Kurasi",
    published: "Dipublikasikan",
    rejected: "Ditolak",
    submitted: "Terkirim",
    under_review: "Sedang Diperiksa",
    verified: "Terverifikasi",
  };
  return map[status] ?? status;
}

/**
 * Mengembalikan warna badge berdasarkan status.
 */
export function statusVariant(
  status: ProjectStatus | PkmStatus
): "pending" | "published" | "rejected" | "submitted" | "under_review" | "verified" | "draft" {
  return status as ReturnType<typeof statusVariant>;
}
