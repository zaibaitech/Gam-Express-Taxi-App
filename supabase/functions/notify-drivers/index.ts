import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  const payload = await req.json();
  const booking = payload.record;

  if (!booking || booking.status !== 'pending') {
    return new Response('OK', { status: 200 });
  }

  const { data: drivers } = await supabase
    .from('drivers')
    .select('push_token')
    .eq('is_online', true)
    .not('push_token', 'is', null);

  if (!drivers || drivers.length === 0) {
    return new Response('No online drivers', { status: 200 });
  }

  const pickup = booking.pickup_address ?? 'Unknown pickup';
  const dropoff = booking.dropoff_address ?? 'Unknown destination';

  const messages = drivers
    .map((d: { push_token: string }) => d.push_token)
    .filter(Boolean)
    .map((token: string) => ({
      to: token,
      title: '🚕 New Ride Request',
      body: `${pickup} → ${dropoff}`,
      data: { bookingId: booking.id },
      sound: 'default',
      priority: 'high',
      channelId: 'ride-requests',
    }));

  // Expo push API accepts max 100 messages per request
  for (let i = 0; i < messages.length; i += 100) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
  }

  return new Response(`Notified ${messages.length} driver(s)`, { status: 200 });
});
