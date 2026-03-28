import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Tables } from '@/lib/supabase/types';
import type { ApiSuccess } from '@/types/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error?.message ?? 'Request failed');
  return json.data;
}

export function useAccounts() {
  return useQuery<Tables<'accounts'>[]>({
    queryKey: ['accounts'],
    queryFn: () => fetchJson<Tables<'accounts'>[]>('/api/accounts'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAccount(id: string) {
  return useQuery<Tables<'accounts'>>({
    queryKey: ['accounts', id],
    queryFn: () => fetchJson<Tables<'accounts'>>(`/api/accounts/${id}`),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchJson<Tables<'accounts'>>('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetchJson<Tables<'accounts'>>(`/api/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ deleted: boolean }>(`/api/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useConnectAccount() {
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await fetchJson<{ auth_url: string }>(`/api/accounts/${id}/connect`, {
        method: 'POST',
      });
      window.location.href = result.auth_url;
    },
  });
}
