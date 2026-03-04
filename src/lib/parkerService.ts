/**
 * parkerService.ts — Supabase operations for parkers (users)
 *
 * Supabase CRUD operations for parkers (users).
 * Uses plain Supabase queries with atomic claim pattern.
 *
 * Key district rules:
 *   - Only logged-in GitHub users are parked in the district
 *   - Profiles update on every sign-in to ensure fresh repo data
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
    top_repos: any[];
    rank: number | null;
    claimed: boolean;
    visit_count: number;
    kudos_count: number;
    created_at: string;
}

const SELECT_FIELDS = 'id, github_login, display_name, avatar_url, public_repos, total_stars, total_forks, primary_language, top_repos, rank, claimed, visit_count, kudos_count, created_at';

// ─── Check if parker already exists (free, no rate limit) ───

export async function getParker(githubLogin: string): Promise<ParkerRecord | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase();

    const { data } = await supabase
        .from('parkers')
        .select(SELECT_FIELDS)
        .eq('github_login', githubLogin.toLowerCase())
        .maybeSingle();

    return data as ParkerRecord | null;
}

// ─── Upsert Parker (Auth Required) ─────────────────────────

export async function upsertParker(
    data: {
        github_login: string;
        github_id?: number;
        display_name?: string | null;
        avatar_url?: string | null;
        bio?: string | null;
        public_repos: number;
        total_stars: number;
        total_forks: number;
        primary_language?: string | null;
        top_repos?: any[];
    },
    authUserId?: string,
): Promise<ParkerRecord | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = getSupabase();
    const existing = await getParker(data.github_login);
    const isNew = !existing;

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
                top_repos: data.top_repos ?? [],
                fetched_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'github_login' },
        )
        .select(SELECT_FIELDS)
        .single();

    if (error) {
        console.warn('[Parker] Upsert error:', error.message);
        return null;
    }

    if (isNew && parker) {
        const row = parker as ParkerRecord;
        await insertFeedEvent('parked', row.id, null, {
            login: row.github_login,
            stars: data.total_stars,
        });
        await supabase.rpc('recalculate_ranks');
    }

    return parker as ParkerRecord;
}

// ─── Fetch All Parkers ──────────────────────────────────────

export async function fetchAllParkers(): Promise<ParkerRecord[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('parkers')
        .select(SELECT_FIELDS)
        .order('id', { ascending: true });

    if (error) {
        console.warn('[Parker] Fetch all error:', error.message);
        return [];
    }
    return (data || []) as ParkerRecord[];
}

// ─── Claim Section ──────────────────────────────────────────

export async function claimSection(
    githubLogin: string,
    authUserId: string,
): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };
    const supabase = getSupabase();

    const { data: existing } = await supabase
        .from('parkers')
        .select('github_login')
        .eq('claimed_by', authUserId)
        .maybeSingle();

    if (existing) return { success: false, error: 'You already claimed a section' };

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

    if (error || !data) return { success: false, error: 'Section not found or already claimed' };

    const row = data as { id: number; github_login: string };
    await insertFeedEvent('claimed', row.id, null, { login: row.github_login });
    return { success: true };
}

// ─── Give Kudos (Social Like) ──────────────────────────────

export async function giveKudos(
    giverGithubLogin: string,
    targetParkerId: number
): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: false };
    const supabase = getSupabase();

    const giver = await getParker(giverGithubLogin);
    if (!giver) return { success: false, error: 'You must be parked to give kudos' };
    if (giver.id === targetParkerId) return { success: false, error: 'Cannot give kudos to yourself' };

    const { error: kudosErr } = await supabase
        .from('parker_kudos')
        .insert({
            giver_id: giver.id,
            target_id: targetParkerId,
            given_date: new Date().toISOString().split('T')[0]
        });

    if (kudosErr) {
        if (kudosErr.code === '23505') return { success: false, error: 'Already gave kudos today' };
        return { success: false, error: kudosErr.message };
    }

    await supabase.rpc('increment_kudos_count', { target_p_id: targetParkerId });
    await insertFeedEvent('starred', giver.id, targetParkerId);

    return { success: true };
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

// ─── Global Stats ──────────────────────────────────────────

export async function fetchDistrictStats(): Promise<{
    total_parkers: number;
    total_stars: number;
} | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = getSupabase();
    const { data } = await supabase
        .from('district_stats')
        .select('total_parkers, total_stars')
        .eq('id', 1)
        .maybeSingle();

    return data;
}
