export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 200, 500);

  const { results } = await db.prepare(`
    SELECT
      h.player_id,
      h.country, h.region, h.city,
      h.seen_at AS last_seen,
      (SELECT MIN(seen_at) FROM heartbeat WHERE player_id = h.player_id) AS first_seen,
      COALESCE(g.games_played, 0) AS games_played,
      COALESCE(g.wins, 0) AS wins,
      COALESCE(g.losses, 0) AS losses,
      COALESCE(ot.total_online, 0) AS total_play_time,
      g.avg_survival,
      g.best_survival,
      g.avg_fps,
      COALESCE(h.platform, lp.platform) AS platform
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY seen_at DESC) AS rn
      FROM heartbeat
    ) h
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
    ) g ON h.player_id = g.player_id
    LEFT JOIN (
      WITH hg AS (
        SELECT player_id, seen_at,
          COALESCE(CAST(
            JULIANDAY(seen_at) - JULIANDAY(LAG(seen_at) OVER (
              PARTITION BY player_id ORDER BY seen_at
            )) AS REAL
          ) * 86400, 9999) AS gap
        FROM heartbeat
      ),
      ss AS (
        SELECT player_id, seen_at,
          SUM(CASE WHEN gap > 90 THEN 1 ELSE 0 END) OVER (
            PARTITION BY player_id ORDER BY seen_at
          ) AS sid
        FROM hg
      ),
      sd AS (
        SELECT player_id, sid,
          ROUND((JULIANDAY(MAX(seen_at)) - JULIANDAY(MIN(seen_at))) * 86400 + 30) AS dur
        FROM ss
        GROUP BY player_id, sid
      )
      SELECT player_id, SUM(dur) AS total_online
      FROM sd
      GROUP BY player_id
    ) ot ON h.player_id = ot.player_id
    LEFT JOIN (
      SELECT player_id, platform, ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY ended_at DESC) AS rn
      FROM game_session WHERE platform IS NOT NULL
    ) lp ON h.player_id = lp.player_id AND lp.rn = 1
    WHERE h.rn = 1
    ORDER BY h.seen_at DESC
    LIMIT ?1
  `).bind(limit).all();

  return Response.json(results);
}
