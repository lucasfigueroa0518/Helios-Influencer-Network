'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, FileImage } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchApi } from '@/lib/fetch-api';
import { useAccounts } from '@/hooks/use-accounts';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Tables } from '@/lib/supabase/types';

type PostRow = Tables<'posts'> & {
  accounts?: {
    display_name: string;
    avatar_url: string | null;
    instagram_username: string | null;
  } | null;
};

const STATUS_TABS = ['all', 'draft', 'scheduled', 'published', 'failed'] as const;

export default function PostsPage() {
  const [accountId, setAccountId] = useState('all');
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('all');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selected, setSelected] = useState<PostRow | null>(null);

  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set('per_page', '60');
    if (accountId !== 'all') p.set('account_id', accountId);
    if (status !== 'all') p.set('status', status);
    if (searchDebounced.trim()) p.set('q', searchDebounced.trim());
    return p.toString();
  }, [accountId, status, searchDebounced]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['posts', accountId, status, searchDebounced],
    queryFn: () => fetchApi<PostRow[]>(`/api/posts${queryParams ? `?${queryParams}` : ''}`),
  });

  const posts = data ?? [];

  const accountById = useMemo(
    () => new Map((accounts ?? []).map((a) => [a.id, a])),
    [accounts]
  );

  const selectedAccount = useMemo(() => {
    if (!selected) return null;
    return selected.accounts ?? accountById.get(selected.account_id) ?? null;
  }, [selected, accountById]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchDebounced(search);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground">Manage drafts, scheduled content, and published posts.</p>
        </div>
        <Button className="min-h-11 w-fit" render={<Link href="/" />}>
          Upload from dashboard
        </Button>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <Tabs value={status} onValueChange={(v) => setStatus(v as (typeof STATUS_TABS)[number])}>
          <TabsList variant="line" className="h-auto min-h-11 flex-wrap justify-start gap-1">
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s} className="min-h-11 px-3 capitalize">
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={accountId}
            onValueChange={(v) => setAccountId(v && v.length > 0 ? v : 'all')}
            disabled={accountsLoading}
          >
            <SelectTrigger className="min-h-11 w-full sm:w-[220px]">
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
          <form onSubmit={onSearchSubmit} className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search captions…"
              className="min-h-11 w-full sm:w-56"
            />
            <Button type="submit" className="min-h-11 min-w-11 shrink-0" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="aspect-square w-full rounded-t-xl rounded-b-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={FileImage}
          title="No posts match"
          description="Try another filter or create new content from the dashboard."
          action={{ label: 'Open dashboard', href: '/' }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => {
            const acc = post.accounts ?? accountById.get(post.account_id);
            const thumb = post.thumbnail_url || post.media_urls?.[0];
            return (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelected(post)}
                className="rounded-xl border border-border bg-card text-left shadow-sm outline-none transition hover:border-primary/30 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-muted">
                  {thumb ? (
                    <Image src={thumb} alt="" fill unoptimized className="object-cover" sizes="(max-width:768px) 100vw, 25vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <FileImage className="h-10 w-10 opacity-30" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={post.status} />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={acc?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {(acc?.display_name ?? '?').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{post.caption || 'No caption'}</p>
                  <p className="text-xs text-muted-foreground">{acc?.display_name ?? 'Account'}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Post detail</SheetTitle>
                <SheetDescription>
                  {selectedAccount?.display_name ?? 'Account'} ·{' '}
                  {selectedAccount?.instagram_username
                    ? `@${selectedAccount.instagram_username}`
                    : 'Instagram'}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="relative mt-2 aspect-square w-full overflow-hidden rounded-lg bg-muted">
                  {(selected.thumbnail_url || selected.media_urls?.[0]) && (
                    <Image
                      src={selected.thumbnail_url || selected.media_urls[0]}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusBadge status={selected.status} />
                </div>
                <Separator className="my-4" />
                <p className="whitespace-pre-wrap text-sm">{selected.caption || 'No caption'}</p>
              </ScrollArea>
              <div className="border-t pt-4">
                <Button className="min-h-11 w-full" variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
