import type { Job } from 'bullmq';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { geminiModel } from '@/lib/gemini/client';
import { buildTopicDetectionPrompt } from '@/lib/gemini/prompts';
import { parseTopicDetection } from '@/lib/gemini/parse';
import { subDays } from 'date-fns';

export async function detectTopics(_job: Job) {
  const supabase = createServiceRoleClient();

  const { data: users } = await supabase.from('profiles').select('id');
  if (!users?.length) return;

  for (const user of users) {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    const { data: userAccounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id);

    const accountIds = (userAccounts ?? []).map((a) => a.id);
    if (!accountIds.length) continue;

    const { data: recentPosts } = await supabase
      .from('posts')
      .select('id, caption, detected_topics')
      .in('account_id', accountIds)
      .gte('created_at', sevenDaysAgo)
      .not('caption', 'eq', '')
      .limit(100);

    const userPosts = recentPosts ?? [];

    if (userPosts.length < 3) continue;

    const captions = userPosts.map((p) => p.caption);

    try {
      const result = await geminiModel.generateContent(buildTopicDetectionPrompt(captions));
      const parsed = parseTopicDetection(result.response.text());

      const { data: existingClients } = await supabase
        .from('clients')
        .select('topic_keywords')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const existingKeywords = new Set(
        (existingClients ?? []).flatMap((c) => c.topic_keywords.map((k) => k.toLowerCase()))
      );

      for (const topic of parsed.topics) {
        if (topic.frequency < 3) continue;
        if (existingKeywords.has(topic.topic.toLowerCase())) continue;

        const { data: existingSuggestion } = await supabase
          .from('topic_suggestions')
          .select('id')
          .eq('user_id', user.id)
          .eq('topic', topic.topic)
          .eq('status', 'pending')
          .single();

        if (existingSuggestion) continue;

        const sampleIds = userPosts
          .filter((p) =>
            p.detected_topics.some((t) => t.toLowerCase() === topic.topic.toLowerCase())
          )
          .slice(0, 5)
          .map((p) => p.id);

        await supabase.from('topic_suggestions').insert({
          user_id: user.id,
          topic: topic.topic,
          frequency: topic.frequency,
          sample_post_ids: sampleIds,
          suggested_keywords: topic.sample_keywords,
        });
      }
    } catch {
      // Skip AI errors
    }
  }
}
