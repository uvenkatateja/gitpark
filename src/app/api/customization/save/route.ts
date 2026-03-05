/**
 * Save Customization API Route
 * POST: Save car customization for a user
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { parkerId, repoId, repoName, color, decals, underglow, exhaust, plate } = await request.json();

    if (!parkerId || !repoId || !repoName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('save_car_customization', {
      p_parker_id: parkerId,
      p_repo_id: repoId,
      p_repo_name: repoName,
      p_color: color || null,
      p_decals: decals || null,
      p_underglow: underglow || null,
      p_exhaust: exhaust || null,
      p_plate: plate || null,
    });

    if (error) {
      console.error('Error saving customization:', error);
      return NextResponse.json({ error: 'Failed to save customization' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save customization API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
