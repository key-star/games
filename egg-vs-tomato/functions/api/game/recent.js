import { checkAdminToken } from '../_admin-guard.js';

export async function onRequest(context) {
  const { request, env } = context;
  const unauthorized = checkAdminToken(request, env);
  if (unauthorized) return unauthorized;

  const db = env.DB;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 200);
  const { results } = await db.prepare(
    `SELECT s.id, s.player_id, s.survival_seconds, s.result, s.kills, s.damage_amount, s.remaining_hp, s.gold_earned, s.difficulty, s.game_mode, s.challenge_goal, s.ended_at,
            s.platform, s.avg_fps, s.is_new_player, s.artifacts,
            p.country, p.region, p.city, p.nickname
     FROM game_session s
     LEFT JOIN players p ON s.player_id = p.player_id
     ORDER BY s.ended_at DESC
     LIMIT ?1`
  ).bind(limit).all();
  return Response.json(results);
}
