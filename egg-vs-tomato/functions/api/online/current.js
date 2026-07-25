export async function onRequest(context) {
  const { env } = context;
  const db = env.DB;
  const { results } = await db.prepare(
    `SELECT COUNT(DISTINCT player_id) AS count
     FROM online_session
     WHERE ended_at >= datetime('now', '-60 seconds')`
  ).all();
  const count = results[0]?.count || 0;
  return Response.json({ online: count });
}
