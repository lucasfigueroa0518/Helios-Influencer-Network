import type { Job } from 'bullmq';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { addDays, setHours, setMinutes } from 'date-fns';

interface ScheduleDistributionData {
  batchId: string;
  mode: 'even' | 'optimal';
}

export async function scheduleDistribution(job: Job<ScheduleDistributionData>) {
  const supabase = createServiceRoleClient();
  const { batchId, mode } = job.data;

  const { data: batch } = await supabase
    .from('upload_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (!batch) return;

  const { data: account } = await supabase
    .from('accounts')
    .select('posting_schedule')
    .eq('id', batch.account_id)
    .single();

  if (!account) return;

  const schedule = account.posting_schedule as { times: string[]; timezone: string; max_per_day: number };

  const { data: draftPosts } = await supabase
    .from('posts')
    .select('id')
    .eq('upload_batch_id', batchId)
    .eq('status', 'draft')
    .order('created_at');

  if (!draftPosts?.length) return;

  const times = schedule.times ?? ['09:00', '12:00', '18:00'];
  const maxPerDay = schedule.max_per_day ?? 3;

  let dayOffset = 1;
  let timeIndex = 0;
  let postsToday = 0;

  for (const post of draftPosts) {
    if (postsToday >= maxPerDay || timeIndex >= times.length) {
      dayOffset++;
      timeIndex = 0;
      postsToday = 0;
    }

    const [hours, minutes] = times[timeIndex].split(':').map(Number);
    const scheduledAt = setMinutes(setHours(addDays(new Date(), dayOffset), hours), minutes);

    await supabase.from('posts').update({
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString(),
    }).eq('id', post.id);

    await supabase.from('scheduled_posts').upsert({
      post_id: post.id,
      account_id: batch.account_id,
      scheduled_at: scheduledAt.toISOString(),
      priority: draftPosts.length - postsToday,
    }, { onConflict: 'post_id' });

    timeIndex++;
    postsToday++;
  }

  await supabase.from('upload_batches').update({ status: 'completed' }).eq('id', batchId);
}
