export async function onRequest(context) {
  const { env } = context;
  const db = env.DB;
  const { results: topErrors } = await db.prepare(
    `SELECT message, COUNT(*) AS count
     FROM error_log
     WHERE created_at >= datetime('now', '-7 days')
     GROUP BY message
     ORDER BY count DESC
     LIMIT 10`
  ).all();
  const { results: total } = await db.prepare(
    `SELECT COUNT(*) AS total FROM error_log WHERE created_at >= datetime('now', '-7 days')`
  ).all();
  const { results: daily } = await db.prepare(
    `SELECT strftime('%Y-%m-%d', created_at) AS date, COUNT(*) AS count
     FROM error_log
     WHERE created_at >= datetime('now', '-7 days')
     GROUP BY strftime('%Y-%m-%d', created_at)
     ORDER BY date ASC`
  ).all();
  const { results: totalGames } = await db.prepare(
    `SELECT COUNT(*) AS total FROM game_session WHERE ended_at >= datetime('now', '-7 days')`
  ).all();
  return Response.json({
    topErrors,
    total: total[0]?.total || 0,
    daily,
    totalGames: totalGames[0]?.total || 0,
    crashRate: totalGames[0]?.total > 0 ? ((total[0]?.total || 0) / totalGames[0].total * 100).toFixed(1) : '0.0'
  });
}
