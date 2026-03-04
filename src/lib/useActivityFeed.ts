/**
 * useActivityFeed.ts — Live activity feed from Supabase
 *
 * Live activity feed from Supabase.
 * Uses plain Supabase queries without Database generics.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase, isSupabaseConfigured } from './supabase';

export interface FeedEvent {
    id: string;
    event_type: string;
    actor_login: string | null;
    actor_avatar: string | null;
    target_login: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

// ─── Raw row type from Supabase ─────────────────────────────

interface FeedRow {
    id: string;
    event_type: string;
    actor_id: number | null;
    target_id: number | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

interface ParkerRow {
    id: number;
    github_login: string;
    avatar_url: string | null;
}

// ─── Hook ───────────────────────────────────────────────────

export function useActivityFeed(enabled: boolean = true) {
    const [events, setEvents] = useState<FeedEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const fetchedRef = useRef(false);

    const fetchFeed = useCallback(async () => {
        if (!isSupabaseConfigured()) return;

        const supabase = getSupabase();
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('activity_feed')
                .select('id, event_type, actor_id, target_id, metadata, created_at')
                .order('created_at', { ascending: false })
                .limit(30);

            if (error || !data) {
                console.warn('[Feed] Error fetching:', error?.message);
                return;
            }

            const rows = data as FeedRow[];
            if (rows.length === 0) return;

            // Collect unique parker IDs
            const parkerIds = new Set<number>();
            for (const e of rows) {
                if (e.actor_id) parkerIds.add(e.actor_id);
                if (e.target_id) parkerIds.add(e.target_id);
            }

            // Batch fetch parker info
            const parkerMap: Record<number, { login: string; avatar: string | null }> = {};
            if (parkerIds.size > 0) {
                const { data: parkers } = await supabase
                    .from('parkers')
                    .select('id, github_login, avatar_url')
                    .in('id', Array.from(parkerIds));

                for (const p of (parkers ?? []) as ParkerRow[]) {
                    parkerMap[p.id] = { login: p.github_login, avatar: p.avatar_url };
                }
            }

            // Enrich events
            const enriched: FeedEvent[] = rows.map((e) => ({
                id: e.id,
                event_type: e.event_type,
                actor_login: e.actor_id ? parkerMap[e.actor_id]?.login ?? null : null,
                actor_avatar: e.actor_id ? parkerMap[e.actor_id]?.avatar ?? null : null,
                target_login: e.target_id ? parkerMap[e.target_id]?.login ?? null : null,
                metadata: e.metadata ?? {},
                created_at: e.created_at,
            }));

            setEvents(enriched);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled || fetchedRef.current) return;
        fetchedRef.current = true;
        fetchFeed();
    }, [enabled, fetchFeed]);

    // Realtime subscription for new events
    useEffect(() => {
        if (!enabled || !isSupabaseConfigured()) return;

        const supabase = getSupabase();
        const channel = supabase
            .channel('feed-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'activity_feed' },
                () => { fetchFeed(); },
            )
            .subscribe();

        return () => { channel.unsubscribe(); };
    }, [enabled, fetchFeed]);

    return { events, loading, refetch: fetchFeed };
}

// ─── Insert Feed Event ──────────────────────────────────────

export async function insertFeedEvent(
    eventType: string,
    actorId: number | null,
    targetId: number | null = null,
    metadata: Record<string, unknown> = {},
) {
    if (!isSupabaseConfigured()) return;

    const supabase = getSupabase();
    await supabase.from('activity_feed').insert({
        event_type: eventType,
        actor_id: actorId,
        target_id: targetId,
        metadata,
    });
}
