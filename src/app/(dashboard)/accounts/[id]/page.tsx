'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useUpdateAccount } from '@/hooks/use-accounts';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: account, isLoading } = useAccount(id);
  const updateAccount = useUpdateAccount();

  const [displayName, setDisplayName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [toneKeywords, setToneKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [times, setTimes] = useState<string[]>(['09:00', '12:00', '18:00']);
  const [timezone, setTimezone] = useState('UTC');
  const [maxPerDay, setMaxPerDay] = useState(3);

  useEffect(() => {
    if (account) {
      setDisplayName(account.display_name);
      setSystemPrompt(account.system_prompt);
      setToneKeywords(account.tone_keywords);
      const schedule = account.posting_schedule as { times: string[]; timezone: string; max_per_day: number };
      setTimes(schedule.times ?? ['09:00', '12:00', '18:00']);
      setTimezone(schedule.timezone ?? 'UTC');
      setMaxPerDay(schedule.max_per_day ?? 3);
    }
  }, [account]);

  const handleSave = async () => {
    try {
      await updateAccount.mutateAsync({
        id,
        data: {
          display_name: displayName,
          system_prompt: systemPrompt,
          tone_keywords: toneKeywords,
          posting_schedule: { times, timezone, max_per_day: maxPerDay },
        },
      });
      toast.success('Account updated');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !toneKeywords.includes(kw)) {
      setToneKeywords([...toneKeywords, kw]);
    }
    setKeywordInput('');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!account) {
    return <div>Account not found</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/accounts')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{account.display_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {account.instagram_username && (
              <span className="text-sm text-muted-foreground">@{account.instagram_username}</span>
            )}
            <StatusBadge status={account.api_status} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Persona</CardTitle>
          <CardDescription>
            Define the personality and voice for AI-generated content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt</Label>
            <Textarea
              id="system_prompt"
              rows={6}
              placeholder="You are Mia, a 25-year-old fitness influencer who loves clean eating and outdoor workouts..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This prompt is sent to the AI when generating captions and replies for this account.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tone Keywords</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. witty, empowering"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              />
              <Button variant="outline" onClick={addKeyword}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {toneKeywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="gap-1">
                  {kw}
                  <button onClick={() => setToneKeywords(toneKeywords.filter((k) => k !== kw))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posting Schedule</CardTitle>
          <CardDescription>
            Configure when posts should be published for this account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_per_day">Max Posts Per Day</Label>
              <Input
                id="max_per_day"
                type="number"
                min={1}
                max={25}
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(parseInt(e.target.value) || 3)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Posting Times</Label>
            <div className="flex flex-wrap gap-2">
              {times.map((t, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Input
                    type="time"
                    value={t}
                    className="w-32"
                    onChange={(e) => {
                      const next = [...times];
                      next[i] = e.target.value;
                      setTimes(next);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTimes(times.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setTimes([...times, '12:00'])}>
                + Add Time
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateAccount.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
