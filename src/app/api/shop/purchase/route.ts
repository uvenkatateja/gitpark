/**
 * Shop Purchase API Route
 * POST: Purchase an item from the shop
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { parkerId, itemId, quantity = 1 } = await request.json();

    if (!parkerId || !itemId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('purchase_shop_item', {
      p_parker_id: parkerId,
      p_item_id: itemId,
      p_quantity: quantity,
    });

    if (error) {
      console.error('Purchase error:', error);
      return NextResponse.json({ error: 'Purchase failed' }, { status: 500 });
    }

    const result = data?.[0];
    
    return NextResponse.json({
      success: result?.success || false,
      newBalance: result?.new_balance,
      errorMessage: result?.error_message,
    });
  } catch (error) {
    console.error('Purchase API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
