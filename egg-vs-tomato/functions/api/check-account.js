export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const db = env.DB;
  const body = await request.json();
  const player_id = body.player_id || '';

  if (!player_id) {
    return new Response(JSON.stringify({ ok: true, hasAccount: false, nickname: '' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }

  const account = await db.prepare(
    'SELECT nickname FROM players WHERE player_id = ?1'
  ).bind(player_id).first();

  return new Response(JSON.stringify({
    ok: true,
    hasAccount: !!account,
    nickname: account ? account.nickname : ''
  }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
