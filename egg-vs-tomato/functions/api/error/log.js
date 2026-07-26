import { checkAdminToken } from '../_admin-guard.js';

export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;

  if (request.method === 'DELETE') {
    const unauthorized = checkAdminToken(request, env);
    if (unauthorized) return unauthorized;

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) {
      await db.prepare('DELETE FROM error_log WHERE id = ?1').bind(id).run();
    } else {
      await db.prepare('DELETE FROM error_log').run();
    }
    return new Response('ok', { status: 200 });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await request.json();
  const { player_id, survival_time, message, stack } = body;
  await db.prepare(
    `INSERT INTO error_log (player_id, survival_time, message, stack)
     VALUES (?1, ?2, ?3, ?4)`
  ).bind(
    player_id || '',
    survival_time || 0,
    message || '',
    stack || ''
  ).run();
  return new Response('ok', { status: 200 });
}
