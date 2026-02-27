import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/slips - List all slips
export async function GET(request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('slips')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/slips - Create new slip
export async function POST(request) {
  try {
    const body = await request.json();

    // Remove id if accidentally passed
    delete body.id;
    delete body.created_at;
    delete body.updated_at;

    const { data, error } = await supabaseAdmin
      .from('slips')
      .insert([{ ...body, status: 'pending', log_entries: [] }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
