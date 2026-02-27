import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/slips/[id]
export async function GET(request, { params }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('slips')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/slips/[id]
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    delete body.id;
    delete body.created_at;

    const { data, error } = await supabaseAdmin
      .from('slips')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/slips/[id]
export async function DELETE(request, { params }) {
  try {
    const { error } = await supabaseAdmin
      .from('slips')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
