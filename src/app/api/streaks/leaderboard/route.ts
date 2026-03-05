/**
 * Streak Leaderboard API Route
 * GET: Fetch top users by current streak
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error } = await supabase.rpc('get_streak_leaderboard', {
      p_limit: limit,
    });

    if (error) {
      console.error('Leaderboard error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    return NextResponse.json({ leaderboard: data || [] });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
