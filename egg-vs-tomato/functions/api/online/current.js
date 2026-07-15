export async function onRequest(context) {
  const { env } = context;
  const db = env.DB;
  const { results } = await db.prepare(
    `SELECT COUNT(DISTINCT player_id) AS count
     FROM heartbeat
     WHERE seen_at >= datetime('now', '-60 seconds')`
  ).all();
  const count = results[0]?.count || 0;

  await db.prepare(
    'INSERT INTO online_snapshot (count, recorded_at) VALUES (?1, datetime(\'now\'))'
  ).bind(count).run();

  return Response.json({ online: count });
}
