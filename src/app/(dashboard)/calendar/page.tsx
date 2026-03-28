'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';
import { useAccounts } from '@/hooks/use-accounts';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { Tables } from '@/lib/supabase/types';

type CalendarPost = Tables<'posts'>;

function calendarDateKey(p: CalendarPost): string | null {
  const raw =
    p.status === 'published' ? p.published_at : p.scheduled_at;
  return raw ? raw.slice(0, 10) : null;
}

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [mode, setMode] = useState<'month' | 'week'>('month');
  const [accountId, setAccountId] = useState('all');

  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const range = useMemo(() => {
    if (mode === 'month') {
      const monthStart = startOfMonth(viewDate);
      const monthEnd = endOfMonth(viewDate);
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 0 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
      };
    }
    return {
      start: startOfWeek(viewDate, { weekStartsOn: 0 }),
      end: endOfWeek(viewDate, { weekStartsOn: 0 }),
    };
  }, [viewDate, mode]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['calendar', range.start.toISOString(), range.end.toISOString(), accountId],
    queryFn: () => {
      const params = new URLSearchParams({
        start: range.start.toISOString(),
        end: range.end.toISOString(),
        account_id: accountId,
      });
      return fetchApi<CalendarPost[]>(`/api/calendar?${params}`);
    },
  });

  const postsByDay = useMemo(() => {
    const map = new Map<string, CalendarPost[]>();
    for (const p of data ?? []) {
      const key = calendarDateKey(p);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }
    return map;
  }, [data]);

  const days = useMemo(
    () => eachDayOfInterval({ start: range.start, end: range.end }),
    [range.start, range.end]
  );

  const hasNoPosts = !isLoading && !isError && (data?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Scheduled posts across your accounts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={mode} onValueChange={(v) => setMode(v as 'month' | 'week')}>
            <SelectTrigger className="min-h-11 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={accountId}
            onValueChange={(v) => setAccountId(v && v.length > 0 ? v : 'all')}
            disabled={accountsLoading}
          >
            <SelectTrigger className="min-h-11 w-[200px]">
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
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11"
              onClick={() => setViewDate((d) => (mode === 'month' ? subMonths(d, 1) : subWeeks(d, 1)))}
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium tabular-nums">
              {mode === 'month' ? format(viewDate, 'MMMM yyyy') : `Week of ${format(range.start, 'MMM d')}`}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11"
              onClick={() => setViewDate((d) => (mode === 'month' ? addMonths(d, 1) : addWeeks(d, 1)))}
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{mode === 'month' ? 'Month view' : 'Week view'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: mode === 'month' ? 35 : 7 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div
                className={cn(
                  'grid gap-1',
                  mode === 'month' ? 'grid-cols-7' : 'grid-cols-7'
                )}
              >
                {(mode === 'month' ? days : days.slice(0, 7)).map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayPosts = postsByDay.get(key) ?? [];
                  const muted = mode === 'month' && !isSameMonth(day, viewDate);
                  return (
                    <div
                      key={key}
                      className={cn(
                        'flex min-h-[88px] flex-col rounded-md border border-border/60 bg-muted/20 p-1.5 text-left',
                        muted && 'opacity-40',
                        isToday(day) && 'ring-2 ring-primary/40'
                      )}
                    >
                      <span className="text-xs font-semibold tabular-nums">{format(day, 'd')}</span>
                      <div className="mt-1 flex flex-1 flex-wrap gap-0.5 content-start">
                        {dayPosts.slice(0, 3).map((post) => (
                          <div
                            key={post.id}
                            className="relative h-7 w-7 shrink-0 overflow-hidden rounded-sm ring-1 ring-border"
                            title={post.caption?.slice(0, 80)}
                          >
                            {post.thumbnail_url || post.media_urls?.[0] ? (
                              <Image
                                src={post.thumbnail_url || post.media_urls[0]}
                                alt=""
                                fill
                                unoptimized
                                className="object-cover"
                                sizes="28px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted text-[8px] text-muted-foreground">
                                ···
                              </div>
                            )}
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{dayPosts.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {hasNoPosts && (
        <EmptyState
          icon={CalendarDays}
          title="No scheduled posts"
          description="Nothing is scheduled in this range. Create or schedule posts to see them on the calendar."
          action={{ label: 'Go to posts', href: '/posts' }}
        />
      )}
    </div>
  );
}
