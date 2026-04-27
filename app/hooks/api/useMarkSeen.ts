import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../util/apiFetch.js';
import type { Issue } from '../../types.js';

function markSeen(id: string, seen_at: string): Promise<{ ok: boolean }> {
  return apiFetch(`/issues/${id}/seen`, { method: 'POST', body: JSON.stringify({ seen_at }) });
}

export function useMarkSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, seen_at }: { id: string; seen_at: string }) => markSeen(id, seen_at),
    onMutate: ({ id, seen_at }) => {
      // Optimistically update all issues query caches so the dot disappears immediately
      queryClient.setQueriesData<Issue[]>({ queryKey: ['issues'] }, (prev) =>
        prev?.map((issue) =>
          issue.id === id ? { ...issue, metadata: { ...issue.metadata, seen_at } } : issue,
        ),
      );
    },
  });
}
