export async function onRequest(context) {
  const { env } = context;
  const db = env.DB;
  const { results } = await db.prepare(
    `SELECT recorded_at, count
     FROM online_snapshot
     WHERE recorded_at >= datetime('now', '-24 hours')
     ORDER BY recorded_at ASC`
  ).all();
  return Response.json(results);
}
