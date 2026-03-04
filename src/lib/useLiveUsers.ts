/**
 * useLiveUsers.ts — Realtime presence for live user count
 *
 * Realtime presence for live user count.
 * Uses Supabase Realtime Presence to track how many users
 * are viewing the district right now.
 */

import { useState, useEffect, useRef } from 'react';
import { getSupabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Status = 'connecting' | 'connected' | 'error';

export function useLiveUsers() {
    const [count, setCount] = useState(1);
    const [status, setStatus] = useState<Status>('connecting');
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        const supabase = getSupabase();

        // Don't subscribe if Supabase isn't configured
        if (!isSupabaseConfigured()) {
            setStatus('error');
            return;
        }

        const presenceKey = crypto.randomUUID();

        const channel = supabase.channel('district-presence', {
            config: { presence: { key: presenceKey } },
        });

        channelRef.current = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const total = Object.keys(state).length;
                setCount(Math.max(1, total));
                setStatus('connected');
            })
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    setStatus('error');
                }
            });

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, []);

    return { count, status };
}
