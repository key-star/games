export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const db = env.DB;
  const body = await request.json();
  const player_id = body.player_id || '';

  if (!player_id) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing player_id' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  await db.prepare(
    `UPDATE players SET
      unlockedSkins = ?1,
      currentSkin = ?2,
      skinPoints = ?3,
      gold = ?4
    WHERE player_id = ?5`
  ).bind(
    JSON.stringify(body.unlockedSkins || []),
    body.currentSkin || '普通蛋',
    body.skinPoints || 0,
    body.gold || 0,
    player_id
  ).run();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
