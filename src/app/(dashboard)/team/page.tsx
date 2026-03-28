'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/fetch-api';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Tables } from '@/lib/supabase/types';

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
};

type TeamMemberRow = Tables<'team_members'> & { profile: Profile | null };

const ROLES = ['admin', 'manager', 'creator', 'viewer'] as const;

export default function TeamPage() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('creator');

  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['team'],
    queryFn: () => fetchApi<TeamMemberRow[]>('/api/team'),
  });

  const members = data ?? [];

  const invite = useMutation({
    mutationFn: () =>
      fetchApi('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      setOpen(false);
      setEmail('');
      setRole('creator');
      toast.success('Invitation sent');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Members, roles, and pending invites.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="min-h-11" />}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite member
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite teammate</DialogTitle>
              <DialogDescription>
                Sends a Supabase auth invite when service role is configured.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="min-h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as (typeof ROLES)[number])}>
                  <SelectTrigger className="min-h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose render={<Button variant="outline" className="min-h-11" />}>Cancel</DialogClose>
                <Button
                  className="min-h-11"
                  disabled={!email.trim() || invite.isPending}
                  onClick={() => invite.mutate()}
                >
                  Send invite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No team members"
                description="Invite collaborators to help manage accounts, content, and inbox."
                action={{ label: 'Invite member', onClick: () => setOpen(true) }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-4 font-medium">Member</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Invite</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-border/80 last:border-0">
                      <td className="p-4">
                        <div className="flex min-h-11 items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={m.profile?.avatar_url ?? undefined} />
                            <AvatarFallback>
                              {(m.profile?.full_name ?? m.invited_email ?? '?').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{m.profile?.full_name ?? m.invited_email ?? 'Member'}</p>
                            {m.invited_email ? (
                              <p className="text-xs text-muted-foreground">{m.invited_email}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize">
                          {m.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{m.invited_email ?? '—'}</td>
                      <td className="p-4">
                        <StatusBadge status={m.invite_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
