export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const db = env.DB;
  const body = await request.json();
  const { player_id, survival_time, message, stack } = body;
  await db.prepare(
    `INSERT INTO error_log (player_id, survival_time, message, stack)
     VALUES (?1, ?2, ?3, ?4)`
  ).bind(
    player_id || '',
    survival_time || 0,
    message || '',
    stack || ''
  ).run();
  return new Response('ok', { status: 200 });
}
