'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/fetch-api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import type { Tables } from '@/lib/supabase/types';

type Prefs = Tables<'user_preferences'>;

const NOTIFY_KEYS: {
  key: keyof Pick<
    Prefs,
    | 'email_notifications'
    | 'push_notifications'
    | 'notify_new_comments'
    | 'notify_new_dms'
    | 'notify_post_published'
    | 'notify_post_failed'
    | 'notify_topic_suggestion'
    | 'notify_team_activity'
  >;
  label: string;
}[] = [
  { key: 'email_notifications', label: 'Email notifications' },
  { key: 'push_notifications', label: 'Push notifications' },
  { key: 'notify_new_comments', label: 'New comments' },
  { key: 'notify_new_dms', label: 'New DMs' },
  { key: 'notify_post_published', label: 'Post published' },
  { key: 'notify_post_failed', label: 'Post failed' },
  { key: 'notify_topic_suggestion', label: 'Topic suggestions' },
  { key: 'notify_team_activity', label: 'Team activity' },
];

export default function SettingsPage() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
  }, [profile?.full_name]);

  const qc = useQueryClient();
  const { data: prefs, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['settings', 'preferences'],
    queryFn: () => fetchApi<Prefs>('/api/settings/preferences'),
  });

  const updatePrefs = useMutation({
    mutationFn: (patch: Partial<Prefs>) =>
      fetchApi<Prefs>('/api/settings/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }),
    onSuccess: (next) => {
      qc.setQueryData(['settings', 'preferences'], next);
      toast.success('Preferences saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateProfile = useMutation({
    mutationFn: (name: string) =>
      fetchApi<Tables<'profiles'>>('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name }),
      }),
    onSuccess: (next) => {
      setProfile(next);
      toast.success('Profile updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Profile, notifications, and security.</p>
      </div>

      <Tabs defaultValue="profile" className="gap-6">
        <TabsList variant="line" className="h-auto min-h-11 w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="profile" className="min-h-11 px-4">
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="min-h-11 px-4">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="min-h-11 px-4">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your display name and sign-in email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="min-h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={session?.user?.email ?? ''}
                  disabled
                  className="min-h-11 bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email is managed by your auth provider.</p>
              </div>
              <Button
                className="min-h-11"
                disabled={!fullName.trim() || updateProfile.isPending}
                onClick={() => updateProfile.mutate(fullName.trim())}
              >
                Save profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Maps to your user_preferences record.</CardDescription>
            </CardHeader>
            <CardContent>
              {isError && (
                <div className="mb-4 flex flex-col gap-2 rounded-lg border border-destructive/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-destructive">{(error as Error).message}</p>
                  <Button variant="outline" className="min-h-11" onClick={() => refetch()}>
                    Retry
                  </Button>
                </div>
              )}
              {isLoading || !prefs ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 w-full" />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border rounded-lg border">
                  {NOTIFY_KEYS.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex min-h-14 items-center justify-between gap-4 px-4 py-3"
                    >
                      <Label htmlFor={key} className="text-sm font-normal">
                        {label}
                      </Label>
                      <Switch
                        id={key}
                        checked={Boolean(prefs[key])}
                        onCheckedChange={(checked) => updatePrefs.mutate({ [key]: checked })}
                        disabled={updatePrefs.isPending}
                        className="shrink-0"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Protect your HIN workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg text-sm text-muted-foreground">
              <p>
                Password resets and two-factor authentication are handled through your Supabase auth
                settings. Use your provider&apos;s recovery flow if you need to change your password.
              </p>
              <Separator />
              <p>
                For organization-wide policies, restrict API keys and rotate Supabase service role keys
                from the project dashboard.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
