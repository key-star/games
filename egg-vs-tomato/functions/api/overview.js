export async function onRequest(context) {
  const { env } = context;
  const db = env.DB;

  const [online, dau, totalPlayers, totalGames, avgSurvival, regionResults] = await Promise.all([
    db.prepare(`SELECT COUNT(DISTINCT player_id) AS count FROM online_session WHERE ended_at >= datetime('now', '-60 seconds')`).all(),
    db.prepare(`SELECT COUNT(DISTINCT player_id) AS count FROM online_session WHERE ended_at >= datetime('now', '-24 hours')`).all(),
    db.prepare(`SELECT COUNT(*) AS count FROM players`).all(),
    db.prepare(`SELECT COUNT(*) AS count FROM game_session`).all(),
    db.prepare(`SELECT AVG(survival_seconds) AS avg FROM game_session WHERE survival_seconds > 0`).all(),
    db.prepare(`SELECT country, region, city, COUNT(*) AS count FROM players WHERE country IS NOT NULL GROUP BY country, region, city ORDER BY count DESC LIMIT 20`).all(),
  ]);

  return Response.json({
    online: online.results?.[0]?.count || 0,
    dau: dau.results?.[0]?.count || 0,
    totalPlayers: totalPlayers.results?.[0]?.count || 0,
    totalGames: totalGames.results?.[0]?.count || 0,
    avgSurvival: Math.round((avgSurvival.results?.[0]?.avg || 0) * 10) / 10,
    regions: regionResults.results || [],
  });
}
