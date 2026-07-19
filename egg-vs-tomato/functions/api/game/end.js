export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const db = env.DB;
  const body = await request.json();
  const { player_id, survival_seconds, result, kills, damage_amount, remaining_hp, gold_earned, difficulty, game_mode, challenge_goal, platform, avg_fps, is_new_player, artifacts } = body;
  if (!player_id) {
    return new Response('Missing player_id', { status: 400 });
  }
  await db.prepare(
    `INSERT INTO game_session (player_id, started_at, ended_at, survival_seconds, result, kills, damage_amount, remaining_hp, gold_earned, difficulty, game_mode, challenge_goal, platform, avg_fps, is_new_player, artifacts)
     VALUES (?1, datetime('now', '-' || ?2 || ' seconds'), datetime('now'), ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`
  ).bind(
    player_id,
    survival_seconds || 0,
    result || 'gameover',
    kills || 0,
    damage_amount || 0,
    remaining_hp || 0,
    gold_earned || 0,
    difficulty || 0,
    game_mode || 'normal',
    challenge_goal || 0,
    platform || null,
    avg_fps || null,
    is_new_player || 0,
    artifacts || null
  ).run();
  return new Response('ok', { status: 200 });
}
