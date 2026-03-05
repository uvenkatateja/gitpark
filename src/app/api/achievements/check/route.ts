/**
 * Check Achievements API Route
 * POST: Check and award new achievements for a parker
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { parkerId } = await request.json();

    if (!parkerId) {
      return NextResponse.json({ error: 'Parker ID required' }, { status: 400 });
    }

    // Call the database function to check and award achievements
    const { data, error } = await supabase.rpc('check_and_award_achievements', {
      p_parker_id: parkerId,
    });

    if (error) {
      console.error('Error checking achievements:', error);
      return NextResponse.json({ error: 'Failed to check achievements' }, { status: 500 });
    }

    // Fetch details of newly unlocked achievements
    const newlyUnlocked = data || [];
    const newAchievementIds = newlyUnlocked
      .filter((item: any) => item.newly_unlocked)
      .map((item: any) => item.achievement_id);

    let newAchievements = [];
    if (newAchievementIds.length > 0) {
      const { data: achievementDetails, error: detailsError } = await supabase
        .from('achievements')
        .select('*')
        .in('id', newAchievementIds);

      if (!detailsError) {
        newAchievements = achievementDetails || [];
      }
    }

    return NextResponse.json({
      newAchievements,
      count: newAchievements.length,
    });
  } catch (error) {
    console.error('Check achievements API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
