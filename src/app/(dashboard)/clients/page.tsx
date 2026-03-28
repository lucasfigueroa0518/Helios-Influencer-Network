'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/fetch-api';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import type { Tables } from '@/lib/supabase/types';

export default function ClientsPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [campaign, setCampaign] = useState('');
  const [keywords, setKeywords] = useState('');

  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: () => fetchApi<Tables<'clients'>[]>('/api/clients?per_page=200'),
  });

  const clients = data ?? [];

  const createClient = useMutation({
    mutationFn: () =>
      fetchApi<Tables<'clients'>>('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          campaign_name: campaign.trim() || null,
          topic_keywords: keywords
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          hashtag_tracking: [],
          campaign_goals: {},
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      setOpen(false);
      setName('');
      setCampaign('');
      setKeywords('');
      toast.success('Client created');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Campaigns and topic tracking per brand.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="min-h-11" />}>
            <Plus className="mr-2 h-4 w-4" />
            New client
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create client</DialogTitle>
              <DialogDescription>Add a client project to organize content and reporting.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Name</Label>
                <Input
                  id="client-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Brand or company"
                  className="min-h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign (optional)</Label>
                <Input
                  id="campaign"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="Spring launch"
                  className="min-h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Topic keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="skincare, routine, SPF"
                  className="min-h-11"
                />
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose render={<Button variant="outline" className="min-h-11" />}>Cancel</DialogClose>
                <Button
                  className="min-h-11"
                  disabled={!name.trim() || createClient.isPending}
                  onClick={() => createClient.mutate()}
                >
                  Create
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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No clients yet"
          description="Create a client to attach campaigns, keywords, and performance reporting."
          action={{ label: 'Create client', onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-lg">{c.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {c.campaign_name || 'No active campaign'}{' '}
                  {c.campaign_start && c.campaign_end
                    ? `· ${new Date(c.campaign_start).toLocaleDateString()} – ${new Date(c.campaign_end).toLocaleDateString()}`
                    : null}
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {(c.topic_keywords ?? []).length === 0 ? (
                  <span className="text-xs text-muted-foreground">No keywords</span>
                ) : (
                  c.topic_keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="font-normal">
                      {kw}
                    </Badge>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
