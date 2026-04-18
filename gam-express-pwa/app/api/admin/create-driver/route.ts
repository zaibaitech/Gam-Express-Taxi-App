import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-only — uses service role key which bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, phone, vehicle_plate, vehicle_model } = await req.json();

    // Basic validation
    if (!email || !password || !full_name || !phone || !vehicle_plate || !vehicle_model) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // 1. Create the Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so driver can sign in immediately
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'A driver with this phone number already exists.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insert the driver profile row
    const { error: profileError } = await supabaseAdmin
      .from('drivers')
      .insert({
        id: userId,
        full_name,
        phone,
        vehicle_plate,
        vehicle_model,
        is_online: false,
      });

    if (profileError) {
      // Clean up the auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: userId });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
