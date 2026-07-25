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

  const now = new Date();
  const nowISO = now.toISOString().replace('T', ' ').slice(0, 19);

  // Check player exists
  const player = await db.prepare('SELECT 1 FROM players WHERE player_id = ?').bind(player_id).first();
  if (!player) {
    return new Response('Player not found', { status: 200 });
  }

  // Get latest session
  const lastSession = await db.prepare(
    'SELECT id, ended_at FROM online_session WHERE player_id = ? ORDER BY id DESC LIMIT 1'
  ).bind(player_id).first();

  let interval = 9999;
  if (lastSession) {
    const lastEnd = new Date(lastSession.ended_at.replace(' ', 'T') + 'Z');
    interval = Math.round((now - lastEnd) / 1000);
    if (interval < 0) interval = 30;
  }

  // Update players table (always)
  await db.prepare(
    `UPDATE players SET
      total_online_seconds = total_online_seconds + ?1,
      country = ?2, region = ?3, city = ?4, ip = ?5, platform = ?6
    WHERE player_id = ?7`
  ).bind(
    Math.min(interval, 120),
    request.cf?.country || null,
    request.cf?.region || null,
    request.cf?.city || null,
    request.headers.get('CF-Connecting-IP') || null,
    platform || null,
    player_id
  ).run();

  // Handle session
  if (!lastSession || interval > 120) {
    const future = new Date(now.getTime() + 30000);
    const futureISO = future.toISOString().replace('T', ' ').slice(0, 19);
    await db.prepare(
      'INSERT INTO online_session (player_id, started_at, ended_at) VALUES (?1, ?2, ?3)'
    ).bind(player_id, nowISO, futureISO).run();
  } else {
    await db.prepare(
      'UPDATE online_session SET ended_at = ?1 WHERE id = ?2'
    ).bind(nowISO, lastSession.id).run();
  }

  return new Response('ok', { status: 200 });
}
