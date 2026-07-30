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

  // Upsert players table (create row for unregistered players too)
  await db.prepare(
    `INSERT INTO players (player_id, total_online_seconds, country, region, city, ip, platform)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
     ON CONFLICT(player_id) DO UPDATE SET
       total_online_seconds = total_online_seconds + ?2,
       country = ?3, region = ?4, city = ?5, ip = ?6, platform = ?7`
  ).bind(
    player_id,
    Math.min(interval, 120),
    request.cf?.country || null,
    request.cf?.region || null,
    request.cf?.city || null,
    request.headers.get('CF-Connecting-IP') || null,
    platform || null
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
