/**
 * Daily Claim API Route
 * POST: Claim daily free coins
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

    const { data, error } = await supabase.rpc('claim_daily_coins', {
      p_parker_id: parkerId,
    });

    if (error) {
      console.error('Daily claim error:', error);
      return NextResponse.json({ error: 'Claim failed' }, { status: 500 });
    }

    const result = data?.[0];
    
    return NextResponse.json({
      success: result?.success || false,
      coinsAwarded: result?.coins_awarded || 0,
      newBalance: result?.new_balance || 0,
      nextClaimDate: result?.next_claim_date,
    });
  } catch (error) {
    console.error('Daily claim API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
