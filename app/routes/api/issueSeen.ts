import { markSeen } from '../../../server/seen-db.js';

export async function action({
  request,
  params,
}: {
  request: Request;
  params: Record<string, string>;
}) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { id } = params;
  const { seen_at } = (await request.json()) as { seen_at: string };

  markSeen(id, seen_at);

  return Response.json({ ok: true });
}
