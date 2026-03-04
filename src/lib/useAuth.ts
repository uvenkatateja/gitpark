/**
 * useAuth.ts — GitHub OAuth auth hook for Repo Ridez
 *
 * GitHub OAuth auth hook for Repo Ridez.
 *   1. User clicks "Sign in with GitHub"
 *   2. Redirect to Supabase OAuth → GitHub → callback URL
 *   3. Supabase handles token exchange via detectSessionInUrl
 *   4. Session stored in localStorage automatically
 *
 * Usage:
 *   const { session, user, githubLogin, signIn, signOut, loading } = useAuth();
 */

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
    session: Session | null;
    user: User | null;
    githubLogin: string | null;
    loading: boolean;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        session: null,
        user: null,
        githubLogin: null,
        loading: true,
    });

    useEffect(() => {
        const supabase = getSupabase();

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const user = session?.user ?? null;
            const githubLogin = extractGithubLogin(user);
            setState({ session, user, githubLogin, loading: false });
        });

        // Listen for auth changes (login, logout, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user ?? null;
            const githubLogin = extractGithubLogin(user);
            setState({ session, user, githubLogin, loading: false });
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = useCallback(async () => {
        const supabase = getSupabase();
        await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });
    }, []);

    const signOut = useCallback(async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
    }, []);

    return {
        ...state,
        signIn,
        signOut,
    };
}

/**
 * Extract GitHub login from Supabase user metadata.
 * Extract GitHub login from Supabase user metadata.
 */
function extractGithubLogin(user: User | null): string | null {
    if (!user) return null;
    const login =
        user.user_metadata?.user_name ??
        user.user_metadata?.preferred_username ??
        null;
    return login ? login.toLowerCase() : null;
}
