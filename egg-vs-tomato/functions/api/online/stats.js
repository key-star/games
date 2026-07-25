export async function onRequest(context) {
  const { env } = context;
  const db = env.DB;
  const { results } = await db.prepare(
    `SELECT
       strftime('%Y-%m-%dT%H:%M:00', ended_at) AS recorded_at,
       COUNT(DISTINCT player_id) AS count
     FROM online_session
     WHERE ended_at >= datetime('now', '-24 hours')
     GROUP BY strftime('%Y-%m-%dT%H:%M:00', ended_at)
     ORDER BY recorded_at ASC`
  ).all();

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const countMap = new Map(results.map(r => [r.recorded_at, r.count]));
  const filled = [];
  const cursor = new Date(twentyFourHoursAgo);
  cursor.setSeconds(0, 0);
  while (cursor < now) {
    const key = cursor.toISOString().slice(0, 19);
    filled.push({ recorded_at: key, count: countMap.get(key) || 0 });
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return Response.json(filled);
}
