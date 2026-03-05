/**
 * Mark Achievement as Seen API Route
 * POST: Mark achievements as seen by the user
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { parkerId, achievementIds } = await request.json();

    if (!parkerId || !achievementIds || !Array.isArray(achievementIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { error } = await supabase
      .from('parker_achievements')
      .update({ seen: true })
      .eq('parker_id', parkerId)
      .in('achievement_id', achievementIds);

    if (error) {
      console.error('Error marking achievements as seen:', error);
      return NextResponse.json({ error: 'Failed to update achievements' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark seen API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
