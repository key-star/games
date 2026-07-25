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
    'SELECT unlockedSkins, currentSkin, skinPoints, gold FROM players WHERE player_id = ?1'
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
    gold: row.gold || 0
  }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
