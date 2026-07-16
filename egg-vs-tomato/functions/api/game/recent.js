export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 200);
  const { results } = await db.prepare(
    `SELECT s.id, s.player_id, s.survival_seconds, s.result, s.kills, s.max_combo, s.gold_earned, s.difficulty, s.game_mode, s.ended_at,
            s.platform, s.avg_fps, s.is_new_player, s.artifacts,
            h.country, h.region, h.city
     FROM game_session s
     LEFT JOIN (
       SELECT player_id, country, region, city, ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY seen_at DESC) AS rn
       FROM heartbeat
     ) h ON s.player_id = h.player_id AND h.rn = 1
     ORDER BY s.ended_at DESC
     LIMIT ?1`
  ).bind(limit).all();
  return Response.json(results);
}
