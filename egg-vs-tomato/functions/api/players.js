export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 200, 500);

  const { results } = await db.prepare(`
    SELECT
      p.player_id,
      p.country, p.region, p.city,
      (SELECT MAX(ended_at) FROM online_session WHERE player_id = p.player_id) AS last_seen,
      (SELECT MIN(started_at) FROM online_session WHERE player_id = p.player_id) AS first_seen,
      COALESCE(g.games_played, 0) AS games_played,
      COALESCE(g.wins, 0) AS wins,
      COALESCE(g.losses, 0) AS losses,
      p.total_online_seconds AS total_play_time,
      g.avg_survival,
      g.best_survival,
      g.avg_fps,
      p.platform,
      CASE WHEN COALESCE(g.games_played, 0) = 0 THEN 1 ELSE 0 END AS is_new_player
    FROM players p
    LEFT JOIN (
      SELECT
        player_id,
        COUNT(*) AS games_played,
        SUM(CASE WHEN result = 'victory' THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN result = 'gameover' THEN 1 ELSE 0 END) AS losses,
        ROUND(AVG(survival_seconds)) AS avg_survival,
        MAX(survival_seconds) AS best_survival,
        ROUND(AVG(avg_fps), 1) AS avg_fps
      FROM game_session
      GROUP BY player_id
    ) g ON p.player_id = g.player_id
    ORDER BY last_seen DESC
    LIMIT ?1
  `).bind(limit).all();

  return Response.json(results);
}
