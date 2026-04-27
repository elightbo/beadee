import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../util/apiFetch.js';
import type { Issue } from '../../types.js';

function markSeen(id: string, seen_at: string): Promise<{ ok: boolean }> {
  return apiFetch(`/issues/${id}/seen`, { method: 'POST', body: JSON.stringify({ seen_at }) });
}

function applySeenAt(queryClient: ReturnType<typeof useQueryClient>, id: string, seen_at: string) {
  queryClient.setQueriesData<Issue[]>({ queryKey: ['issues'] }, (prev) =>
    prev?.map((issue) =>
      issue.id === id ? { ...issue, metadata: { ...issue.metadata, seen_at } } : issue,
    ),
  );
}

export function useMarkSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, seen_at }: { id: string; seen_at: string }) => markSeen(id, seen_at),
    onMutate: async ({ id, seen_at }) => {
      // Cancel in-flight fetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey: ['issues'] });
      applySeenAt(queryClient, id, seen_at);
    },
    onSuccess: (_, { id, seen_at }) => {
      // Re-apply after server confirms the write, in case a racing refetch wiped it out
      applySeenAt(queryClient, id, seen_at);
    },
  });
}
