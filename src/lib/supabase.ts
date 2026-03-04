/**
 * supabase.ts — Supabase client for GitPark
 *
 * Supabase client singleton for GitPark.
 * Uses plain createClient() without Database generics for simplicity.
 *
 * Environment variables (set in .env):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Singleton browser Supabase client (anon key, respects RLS).
 * Safe to call anywhere in the app — returns the same instance.
 */
export function getSupabase(): SupabaseClient {
    if (client) return client;

    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.warn(
            '[GitPark] Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
        );
    }

    client = createClient(
        url || 'https://placeholder.supabase.co',
        key || 'placeholder',
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
            },
        },
    );

    return client;
}

/**
 * Check if Supabase is properly configured (env vars present).
 */
export function isSupabaseConfigured(): boolean {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}
