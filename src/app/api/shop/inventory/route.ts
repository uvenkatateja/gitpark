/**
 * Shop Inventory API Route
 * GET: Fetch user's inventory
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const parkerId = searchParams.get('parkerId');

    if (!parkerId) {
      return NextResponse.json({ error: 'Parker ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('parker_inventory')
      .select(`
        item_id,
        quantity,
        purchased_at,
        shop_items (*)
      `)
      .eq('parker_id', parkerId);

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    return NextResponse.json({ inventory: data || [] });
  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
