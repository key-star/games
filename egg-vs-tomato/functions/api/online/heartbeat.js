export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const db = env.DB;
  const { player_id } = await request.json();
  if (!player_id) {
    return new Response('Missing player_id', { status: 400 });
  }
  await db.prepare(
    'INSERT INTO heartbeat (player_id, seen_at) VALUES (?1, datetime(\'now\'))'
  ).bind(player_id).run();
  return new Response('ok', { status: 200 });
}
