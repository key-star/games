export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const db = env.DB;
  const body = await request.json();
  const nickname = (body.nickname || '').trim();
  const password_hash = body.password_hash || '';

  if (!nickname || !password_hash) {
    return new Response(JSON.stringify({ ok: false, error: '昵称和密码不能为空' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const account = await db.prepare(
    'SELECT player_id, password_hash FROM players WHERE nickname = ?1'
  ).bind(nickname).first();

  if (!account) {
    return new Response(JSON.stringify({ ok: false, error: '账号不存在' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  if (account.password_hash !== password_hash) {
    return new Response(JSON.stringify({ ok: false, error: '昵称或密码错误' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: true, player_id: account.player_id }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
