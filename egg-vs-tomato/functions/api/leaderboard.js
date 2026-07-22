export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;

  const { results } = await db.prepare(`
    SELECT
      gs.player_id,
      gs.player_name,
      gs.survival_seconds,
      (COALESCE(gs.damage_amount, 0) + COALESCE(gs.remaining_hp, 0)) AS total_hp,
      COALESCE(gs.kills, 0) AS kills,
      COALESCE(gs.gold_earned, 0) AS gold_earned,
      gs.game_mode,
      gs.ended_at,
      tc.total_games
    FROM game_session gs
    LEFT JOIN (
      SELECT player_id, COUNT(*) AS total_games
      FROM game_session
      GROUP BY player_id
    ) tc ON gs.player_id = tc.player_id
    WHERE gs.survival_seconds > 0
    ORDER BY gs.survival_seconds DESC,
      total_hp ASC,
      kills DESC,
      gold_earned DESC,
      gs.ended_at ASC
    LIMIT 10
  `).all();

  return Response.json(results);
}
