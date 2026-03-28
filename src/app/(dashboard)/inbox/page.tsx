'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/fetch-api';
import { useAccounts } from '@/hooks/use-accounts';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

type InboxItem = {
  id: string;
  type: 'comment' | 'dm';
  account_id: string;
  author_label: string;
  body: string;
  sentiment: string | null;
  priority_score: number;
  ai_response_draft: string | null;
  response_status: string;
  created_at: string;
  post_thumbnail_url: string | null;
  post_caption: string | null;
};

type InboxResponse = { items: InboxItem[] };

export default function InboxPage() {
  const [tab, setTab] = useState<'all' | 'comments' | 'dms'>('all');
  const [accountId, setAccountId] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftEdit, setDraftEdit] = useState('');

  const qc = useQueryClient();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const queryUrl = useMemo(() => {
    const p = new URLSearchParams({ tab });
    if (accountId !== 'all') p.set('account_id', accountId);
    return `/api/comments?${p}`;
  }, [tab, accountId]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['comments', tab, accountId],
    queryFn: () => fetchApi<InboxResponse>(queryUrl),
  });

  const items = data?.items ?? [];

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? items[0] ?? null,
    [items, selectedId]
  );

  useEffect(() => {
    if (selected) setDraftEdit(selected.ai_response_draft ?? '');
  }, [selected?.id, selected?.ai_response_draft]);

  const updateItem = useMutation({
    mutationFn: async (payload: {
      id: string;
      kind: 'comment' | 'dm';
      body: Record<string, unknown>;
    }) => {
      return fetchApi(`/api/comments/${payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload.body, kind: payload.kind }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'], exact: false });
      toast.success('Updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground">Comments and DMs in one place.</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList variant="line" className="h-auto min-h-11 flex-wrap justify-start gap-1">
            <TabsTrigger value="all" className="min-h-11 px-4">
              All
            </TabsTrigger>
            <TabsTrigger value="comments" className="min-h-11 px-4">
              Comments
            </TabsTrigger>
            <TabsTrigger value="dms" className="min-h-11 px-4">
              DMs
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Select
          value={accountId}
          onValueChange={(v) => setAccountId(v && v.length > 0 ? v : 'all')}
          disabled={accountsLoading}
        >
          <SelectTrigger className="min-h-11 w-full lg:w-[220px]">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {(accounts ?? []).map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-destructive">{(error as Error).message}</p>
            <Button className="min-h-11" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid min-h-[480px] gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
        <Card className="flex flex-col overflow-hidden">
          <CardContent className="flex flex-1 flex-col gap-2 p-0">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Inbox}
                  title="Inbox is clear"
                  description="No messages for this filter. Synced comments and DMs will show up here."
                />
              </div>
            ) : (
              <ScrollArea className="h-[480px] lg:h-[calc(100vh-16rem)]">
                <ul className="divide-y divide-border p-2">
                  {items.map((item) => {
                    const active = selected?.id === item.id;
                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className="flex min-h-11 w-full flex-col gap-1 rounded-lg px-3 py-3 text-left transition hover:bg-muted/80 data-[active=true]:bg-primary/10"
                          data-active={active}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">@{item.author_label}</span>
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              P{item.priority_score}
                            </Badge>
                          </div>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {item.type}
                            </Badge>
                            {item.sentiment ? <StatusBadge status={item.sentiment} /> : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardContent className="flex flex-1 flex-col gap-4 p-4">
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="mb-2 h-10 w-10 opacity-30" />
                <p className="text-sm">Select a conversation</p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-semibold">@{selected.author_label}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={selected.response_status} />
                    <Badge variant="outline">Score {selected.priority_score}</Badge>
                    {selected.sentiment ? <StatusBadge status={selected.sentiment} /> : null}
                  </div>
                </div>
                <Separator />
                <ScrollArea className="max-h-40 rounded-md border bg-muted/30 p-3">
                  <p className="text-sm">{selected.body}</p>
                </ScrollArea>
                {selected.post_thumbnail_url && (
                  <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
                    <Image
                      src={selected.post_thumbnail_url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium">AI draft</p>
                  <Textarea
                    value={draftEdit}
                    onChange={(e) => setDraftEdit(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="min-h-11"
                      onClick={() =>
                        updateItem.mutate({
                          id: selected.id,
                          kind: selected.type,
                          body: { response_status: 'approved', ai_response_draft: draftEdit },
                        })
                      }
                      disabled={updateItem.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      className="min-h-11"
                      variant="secondary"
                      onClick={() =>
                        updateItem.mutate({
                          id: selected.id,
                          kind: selected.type,
                          body: { ai_response_draft: draftEdit },
                        })
                      }
                      disabled={updateItem.isPending}
                    >
                      Save edit
                    </Button>
                    <Button
                      className="min-h-11"
                      variant="outline"
                      onClick={() =>
                        updateItem.mutate({
                          id: selected.id,
                          kind: selected.type,
                          body: { response_status: 'ignored' },
                        })
                      }
                      disabled={updateItem.isPending}
                    >
                      Ignore
                    </Button>
                  </div>
                </div>
                <Button
                  className="min-h-11 w-full"
                  variant="ghost"
                  render={<a href={`mailto:?body=${encodeURIComponent(draftEdit)}`} />}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Open mail draft
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
