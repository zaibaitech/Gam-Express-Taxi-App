import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  const { data } = await supabaseAdmin.from('admins').select('id').eq('id', user.id).single();
  return data ? user : null;
}

export async function POST(req: NextRequest) {
  const caller = await verifyAdmin(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message.includes('already') ? 'An account with this email already exists.' : authError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { error: insertError } = await supabaseAdmin.from('admins').insert({ id: authData.user.id, email });

  if (insertError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: authData.user.id });
}

export async function DELETE(req: NextRequest) {
  const caller = await verifyAdmin(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Admin ID required.' }, { status: 400 });
  if (id === caller.id) return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 });

  await supabaseAdmin.from('admins').delete().eq('id', id);
  await supabaseAdmin.auth.admin.deleteUser(id);

  return NextResponse.json({ success: true });
}
