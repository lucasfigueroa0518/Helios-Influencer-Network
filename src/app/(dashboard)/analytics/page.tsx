'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, FileImage, TrendingUp, Users, Clock } from 'lucide-react';
import { fetchApi } from '@/lib/fetch-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type Overview = {
  posts_this_week: number;
  avg_engagement_rate: number;
  follower_growth_placeholder: number | null;
  pending_approvals: number;
  total_followers: number | null;
  trend: { date: string; posts: number; engagement: number }[];
  content_type_breakdown: { type: string; count: number }[];
  best_posting_times: { hour: number; label: string; score: number }[];
};

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-1 h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => fetchApi<Overview>('/api/analytics/overview'),
  });

  const fmtPct = (n: number) => {
    if (n == null || Number.isNaN(n)) return '0%';
    const v = n > 0 && n <= 1 ? n * 100 : n;
    return `${Math.round(v * 10) / 10}%`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Performance snapshot across connected accounts.</p>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Posts this week"
          value={data ? String(data.posts_this_week) : '—'}
          subtitle="Created in the current week"
          icon={FileImage}
          loading={isLoading}
        />
        <MetricCard
          title="Avg engagement"
          value={data ? fmtPct(data.avg_engagement_rate) : '—'}
          subtitle="Published posts"
          icon={TrendingUp}
          loading={isLoading}
        />
        <MetricCard
          title="Total followers"
          value={data?.total_followers != null ? String(data.total_followers) : '—'}
          subtitle={data?.total_followers != null ? 'Latest audience insights' : 'No insight data yet'}
          icon={Users}
          loading={isLoading}
        />
        <MetricCard
          title="Pending approvals"
          value={data ? String(data.pending_approvals) : '—'}
          subtitle="Posts + inbox items"
          icon={Clock}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : (
              <div className="flex h-[280px] flex-col justify-end gap-2 rounded-lg border border-dashed bg-muted/20 p-4">
                <div className="flex flex-1 items-end gap-2">
                  {(data?.trend ?? []).map((point) => {
                    const maxE = Math.max(1, ...((data?.trend ?? []).map((t) => t.engagement)));
                    const h = `${Math.max(8, (point.engagement / maxE) * 100)}%`;
                    return (
                      <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex w-full flex-1 items-end justify-center">
                          <div
                            className="w-full max-w-10 rounded-t-md bg-primary/80 transition-all"
                            style={{ height: h }}
                            title={`${point.date}: ${fmtPct(point.engagement)}`}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {point.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Daily engagement rate (published posts, last 7 days)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content type breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (data?.content_type_breakdown?.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No published posts yet.</p>
            ) : (
              <ul className="space-y-3">
                {data!.content_type_breakdown.map((row) => {
                  const total = data!.content_type_breakdown.reduce((s, r) => s + r.count, 0) || 1;
                  const pct = Math.round((row.count / total) * 100);
                  return (
                    <li key={row.type}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="capitalize">{row.type}</span>
                        <span className="text-muted-foreground">
                          {row.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-secondary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best posting times</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              (data?.best_posting_times ?? []).map((slot) => (
                <div key={slot.hour} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{slot.label}</span>
                  </div>
                  <Badge variant="secondary">Score {slot.score}</Badge>
                </div>
              ))
            )}
            <Separator />
            <p className="text-xs text-muted-foreground">
              Placeholder scores until enough scheduling data is available.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
