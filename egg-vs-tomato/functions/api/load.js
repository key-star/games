export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const player_id = url.searchParams.get('player_id') || '';

  if (!player_id) {
    return new Response(JSON.stringify({}), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }

  const row = await db.prepare(
    `SELECT
      p.unlockedSkins, p.currentSkin, p.skinPoints, p.gold,
      COALESCE((
        SELECT CASE
          WHEN s.result = 'victory' AND s.challenge_goal < 600 THEN s.challenge_goal + 60
          WHEN s.result = 'gameover' AND s.challenge_goal > 60 THEN s.challenge_goal - 60
          ELSE s.challenge_goal
        END
        FROM game_session s
        WHERE s.player_id = ?1 AND s.game_mode = 'challenge'
        ORDER BY s.ended_at DESC LIMIT 1
      ), 60) AS next_challenge_goal
    FROM players p WHERE p.player_id = ?1`
  ).bind(player_id).first();

  if (!row) {
    return new Response(JSON.stringify({}), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    unlockedSkins: JSON.parse(row.unlockedSkins || '[]'),
    currentSkin: row.currentSkin || '普通蛋',
    skinPoints: row.skinPoints || 0,
    gold: row.gold || 0,
    nextChallengeGoal: row.next_challenge_goal || 60
  }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
