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
  if (nickname.length > 20) {
    return new Response(JSON.stringify({ ok: false, error: '昵称最长20个字符' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const existing = await db.prepare(
    'SELECT player_id FROM players WHERE nickname = ?1'
  ).bind(nickname).first();

  if (existing) {
    return new Response(JSON.stringify({ ok: false, error: '该昵称已被注册' }), {
      status: 409, headers: { 'Content-Type': 'application/json' }
    });
  }

  const player_id = crypto.randomUUID().replace(/-/g, '');
  await db.prepare(
    'INSERT INTO players (player_id, nickname, password_hash) VALUES (?1, ?2, ?3)'
  ).bind(player_id, nickname, password_hash).run();

  return new Response(JSON.stringify({ ok: true, player_id }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
}
