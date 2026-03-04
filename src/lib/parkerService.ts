/**
 * parkerService.ts — Supabase operations for parkers (users)
 *
 * Adapted from Git City's claim + dev lookup patterns.
 * Uses plain Supabase queries (no Database generics) — same as Git City.
 */

import { getSupabase, isSupabaseConfigured } from './supabase';
import { insertFeedEvent } from './useActivityFeed';

// ─── Types ──────────────────────────────────────────────────

export interface ParkerRecord {
    id: number;
    github_login: string;
    display_name: string | null;
    avatar_url: string | null;
    public_repos: number;
    total_stars: number;
    total_forks: number;
    primary_language: string | null;
    claimed: boolean;
    visit_count: number;
}

// ─── Upsert Parker ─────────────────────────────────────────

export async function upsertParker(data: {
    github_login: string;
    github_id?: number;
    display_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    public_repos: number;
    total_stars: number;
    total_forks: number;
    primary_language?: string | null;
}): Promise<ParkerRecord | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase();

    const { data: parker, error } = await supabase
        .from('parkers')
        .upsert(
            {
                github_login: data.github_login.toLowerCase(),
                github_id: data.github_id ?? null,
                display_name: data.display_name ?? null,
                avatar_url: data.avatar_url ?? null,
                bio: data.bio ?? null,
                public_repos: data.public_repos,
                total_stars: data.total_stars,
                total_forks: data.total_forks,
                primary_language: data.primary_language ?? null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'github_login' },
        )
        .select('id, github_login, display_name, avatar_url, public_repos, total_stars, total_forks, primary_language, claimed, visit_count')
        .single();

    if (error) {
        console.warn('[Parker] Upsert error:', error.message);
        return null;
    }

    return parker as ParkerRecord;
}

// ─── Claim Section ──────────────────────────────────────────

export async function claimSection(
    githubLogin: string,
    authUserId: string,
): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase not configured' };
    }

    const supabase = getSupabase();

    // Check: has this auth user already claimed another section?
    const { data: existing } = await supabase
        .from('parkers')
        .select('github_login')
        .eq('claimed_by', authUserId)
        .maybeSingle();

    if (existing) {
        return { success: false, error: 'You already claimed a section' };
    }

    // Atomic claim: only succeeds if not already claimed
    const { data, error } = await supabase
        .from('parkers')
        .update({
            claimed: true,
            claimed_by: authUserId,
            claimed_at: new Date().toISOString(),
        })
        .eq('github_login', githubLogin.toLowerCase())
        .eq('claimed', false)
        .select('id, github_login')
        .single();

    if (error || !data) {
        return { success: false, error: 'Section not found or already claimed' };
    }

    // Insert feed event
    const row = data as { id: number; github_login: string };
    await insertFeedEvent('claimed', row.id, null, { login: row.github_login });

    return { success: true };
}

// ─── Get Parker ─────────────────────────────────────────────

export async function getParker(githubLogin: string): Promise<ParkerRecord | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase();

    const { data } = await supabase
        .from('parkers')
        .select('id, github_login, display_name, avatar_url, public_repos, total_stars, total_forks, primary_language, claimed, visit_count')
        .eq('github_login', githubLogin.toLowerCase())
        .maybeSingle();

    return data as ParkerRecord | null;
}

// ─── Increment Visit ────────────────────────────────────────

export async function incrementVisit(parkerGithubLogin: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabase();

    const { data: parker } = await supabase
        .from('parkers')
        .select('id, visit_count')
        .eq('github_login', parkerGithubLogin.toLowerCase())
        .single();

    if (!parker) return;

    const row = parker as { id: number; visit_count: number };
    await supabase
        .from('parkers')
        .update({
            visit_count: (row.visit_count ?? 0) + 1,
            last_visited_at: new Date().toISOString(),
        })
        .eq('id', row.id);
}
