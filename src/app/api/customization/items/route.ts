/**
 * Customization Items API Route
 * GET: Fetch available customization items for a user
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

    const { data, error } = await supabase.rpc('get_available_customization_items', {
      p_parker_id: parseInt(parkerId),
    });

    if (error) {
      console.error('Error fetching customization items:', error);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error('Customization items API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
