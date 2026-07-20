export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const db = env.DB;
  const { player_id, platform } = await request.json();
  if (!player_id) {
    return new Response('Missing player_id', { status: 400 });
  }
  const country = request.cf?.country || null;
  const region = request.cf?.region || null;
  const city = request.cf?.city || null;
  const ip = request.headers.get('CF-Connecting-IP') || null;
  await db.prepare(
    'INSERT INTO heartbeat (player_id, seen_at, country, region, city, ip, platform) VALUES (?1, datetime(\'now\'), ?2, ?3, ?4, ?5, ?6)'
  ).bind(player_id, country, region, city, ip, platform || null).run();
  return new Response('ok', { status: 200 });
}
