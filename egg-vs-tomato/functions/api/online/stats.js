export async function onRequest(context) {
  const { env } = context;
  const db = env.DB;
  const { results } = await db.prepare(
    `SELECT
       strftime('%Y-%m-%dT%H:%M:00', seen_at) AS recorded_at,
       COUNT(DISTINCT player_id) AS count
     FROM heartbeat
     WHERE seen_at >= datetime('now', '-24 hours')
     GROUP BY strftime('%Y-%m-%dT%H:%M:00', seen_at)
     ORDER BY recorded_at ASC`
  ).all();
  return Response.json(results);
}
