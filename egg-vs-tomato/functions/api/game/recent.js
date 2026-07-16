export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 200);
  const { results } = await db.prepare(
    `SELECT id, player_id, survival_seconds, result, kills, max_combo, gold_earned, difficulty, game_mode, ended_at
     FROM game_session
     ORDER BY ended_at DESC
     LIMIT ?1`
  ).bind(limit).all();
  return Response.json(results);
}
