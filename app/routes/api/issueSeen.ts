import { bdRun } from '../../../server/bd.js';
import { suppressWatch } from '../../../server/sse.js';

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

  suppressWatch();
  await bdRun(['update', id, '--set-metadata', `seen_at=${seen_at}`], process.cwd());

  return Response.json({ ok: true });
}
