export function originFrom(request) {
  return new URL(request.url).origin;
}

export async function readJsonSafe(response) {
  try { return await response.json(); }
  catch { return { status: 'error', message: `Upstream returned HTTP ${response.status}.` }; }
}

export function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
