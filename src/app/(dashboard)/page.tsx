'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';
import {
  FileImage,
  TrendingUp,
  Users,
  Clock,
  Upload,
  CalendarDays,
  Inbox,
} from 'lucide-react';

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
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setUploadModalOpen = useUIStore((s) => s.setUploadModalOpen);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              `Welcome back, ${profile?.full_name?.split(' ')[0] ?? 'there'}`
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening across your accounts.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Posts This Week"
          value="0"
          subtitle="No posts yet"
          icon={FileImage}
          loading={isLoading}
        />
        <MetricCard
          title="Avg Engagement Rate"
          value="0%"
          subtitle="Connect an account to start"
          icon={TrendingUp}
          loading={isLoading}
        />
        <MetricCard
          title="Total Followers"
          value="0"
          subtitle="Across all accounts"
          icon={Users}
          loading={isLoading}
        />
        <MetricCard
          title="Pending Approvals"
          value="0"
          subtitle="No items need attention"
          icon={Clock}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center space-y-3">
                <TrendingUp className="h-12 w-12 mx-auto opacity-30" />
                <p>Connect an Instagram account to see performance data.</p>
            <Button variant="outline" size="sm" render={<a href="/accounts" />}>
              Connect Account
            </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start gap-3"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Upload Content
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3" render={<a href="/calendar" />}>
              <CalendarDays className="h-4 w-4" />
              View Calendar
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3" render={<a href="/inbox" />}>
              <Inbox className="h-4 w-4" />
              Check Inbox
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center space-y-3">
              <Users className="h-12 w-12 mx-auto opacity-30" />
              <p className="text-lg font-medium">No accounts connected</p>
              <p className="text-sm">
                Connect your first Instagram account to get started.
              </p>
              <Button render={<a href="/accounts" />}>
                Connect Instagram Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
