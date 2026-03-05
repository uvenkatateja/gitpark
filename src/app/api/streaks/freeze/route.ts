/**
 * Freeze Streak API Route
 * POST: Freeze a user's streak for specified days (premium feature)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { parkerId, days = 1 } = await request.json();

    if (!parkerId) {
      return NextResponse.json({ error: 'Parker ID required' }, { status: 400 });
    }

    if (days < 1 || days > 7) {
      return NextResponse.json({ error: 'Days must be between 1 and 7' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('freeze_streak', {
      p_parker_id: parkerId,
      p_days: days,
    });

    if (error) {
      console.error('Freeze streak error:', error);
      return NextResponse.json({ error: 'Failed to freeze streak' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Freeze streak API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
