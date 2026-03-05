/**
 * Check-in API Route
 * POST: Perform daily check-in and update streak
 * GET: Check if user can check in today
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

    // Call the database function to handle check-in
    const { data, error } = await supabase.rpc('handle_daily_checkin', {
      p_parker_id: parkerId,
    });

    if (error) {
      console.error('Check-in error:', error);
      return NextResponse.json({ error: 'Check-in failed' }, { status: 500 });
    }

    const result = data?.[0];
    
    if (!result) {
      return NextResponse.json({ error: 'No result returned' }, { status: 500 });
    }

    return NextResponse.json({
      success: result.success,
      currentStreak: result.current_streak,
      longestStreak: result.longest_streak,
      isNewRecord: result.is_new_record,
      checkinCount: result.checkin_count,
      streakBroken: result.streak_broken,
      wasFrozen: result.was_frozen,
    });
  } catch (error) {
    console.error('Check-in API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const parkerId = searchParams.get('parkerId');

    if (!parkerId) {
      return NextResponse.json({ error: 'Parker ID required' }, { status: 400 });
    }

    // Check if user can check in today
    const { data, error } = await supabase.rpc('can_checkin_today', {
      p_parker_id: parseInt(parkerId),
    });

    if (error) {
      console.error('Check status error:', error);
      return NextResponse.json({ canCheckin: false });
    }

    return NextResponse.json({ canCheckin: data });
  } catch (error) {
    console.error('Check status API error:', error);
    return NextResponse.json({ canCheckin: false });
  }
}
