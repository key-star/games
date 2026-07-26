export function checkAdminToken(request, env) {
  const token = request.headers.get('X-Admin-Token');
  if (!token || token !== env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }
  return null;
}