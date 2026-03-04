/**
 * database.types.ts — Supabase Database type definitions for Repo Ridez
 *
 * Type definitions for the Supabase tables:
 *   "parkers" — users who have parked repos
 *   "activity_feed" — event log
 *   "visits" — section visit tracking
 */

export interface Database {
    public: {
        Tables: {
            /** Users who have claimed a parking section */
            parkers: {
                Row: {
                    id: number;
                    github_login: string;
                    github_id: number | null;
                    display_name: string | null;
                    avatar_url: string | null;
                    bio: string | null;
                    public_repos: number;
                    total_stars: number;
                    total_forks: number;
                    primary_language: string | null;
                    claimed: boolean;
                    claimed_by: string | null;       // Supabase auth user UUID
                    claimed_at: string | null;
                    visit_count: number;
                    last_visited_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    github_login: string;
                    github_id?: number | null;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    bio?: string | null;
                    public_repos?: number;
                    total_stars?: number;
                    total_forks?: number;
                    primary_language?: string | null;
                    claimed?: boolean;
                    claimed_by?: string | null;
                    claimed_at?: string | null;
                    visit_count?: number;
                    last_visited_at?: string | null;
                };
                Update: Partial<Database['public']['Tables']['parkers']['Insert']>;
            };

            /** Activity feed — events like parking, visiting, starring */
            activity_feed: {
                Row: {
                    id: string;                      // UUID
                    event_type: string;              // 'parked', 'visited', 'starred', etc.
                    actor_id: number | null;         // parkers.id
                    target_id: number | null;        // parkers.id (for interactions)
                    metadata: Record<string, unknown>;
                    created_at: string;
                };
                Insert: {
                    event_type: string;
                    actor_id?: number | null;
                    target_id?: number | null;
                    metadata?: Record<string, unknown>;
                };
                Update: Partial<Database['public']['Tables']['activity_feed']['Insert']>;
            };

            /** Visit tracking — who visited whose section */
            visits: {
                Row: {
                    id: number;
                    visitor_id: number | null;       // parkers.id (null = anonymous)
                    target_id: number;               // parkers.id of section owner
                    visitor_ip_hash: string | null;
                    created_at: string;
                };
                Insert: {
                    visitor_id?: number | null;
                    target_id: number;
                    visitor_ip_hash?: string | null;
                };
                Update: Partial<Database['public']['Tables']['visits']['Insert']>;
            };
        };

        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
    };
}
