/**
 * Achievements API Route
 * GET: Fetch all achievements and user's unlocked achievements
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const parkerId = searchParams.get('parkerId');

    // Fetch all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .order('sort_order');

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError);
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }

    // If parkerId provided, fetch user's unlocked achievements
    let parkerAchievements = [];
    if (parkerId) {
      const { data, error } = await supabase
        .from('parker_achievements')
        .select('*')
        .eq('parker_id', parkerId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        console.error('Error fetching parker achievements:', error);
      } else {
        parkerAchievements = data || [];
      }
    }

    return NextResponse.json({
      achievements: achievements || [],
      parkerAchievements: parkerAchievements,
    });
  } catch (error) {
    console.error('Achievements API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
