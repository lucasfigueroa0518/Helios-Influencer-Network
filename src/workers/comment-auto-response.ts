import type { Job } from 'bullmq';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { geminiModel } from '@/lib/gemini/client';
import { buildCommentResponsePrompt, buildSentimentPrompt } from '@/lib/gemini/prompts';
import { parseCommentResponse, parseSentimentResponse } from '@/lib/gemini/parse';

export async function commentAutoResponse(_job: Job) {
  const supabase = createServiceRoleClient();

  const { data: unprocessed } = await supabase
    .from('comments')
    .select('*')
    .eq('response_status', 'unread')
    .is('sentiment', null)
    .limit(20);

  if (!unprocessed?.length) return;

  for (const comment of unprocessed) {
    try {
      const sentimentResult = await geminiModel.generateContent(
        buildSentimentPrompt(comment.body)
      );
      const sentiment = parseSentimentResponse(sentimentResult.response.text());

      const { data: post } = await supabase
        .from('posts')
        .select('caption, account_id')
        .eq('id', comment.post_id)
        .single();

      if (!post) continue;

      const { data: account } = await supabase
        .from('accounts')
        .select('system_prompt, tone_keywords')
        .eq('id', post.account_id)
        .single();

      if (!account) continue;

      const responseResult = await geminiModel.generateContent(
        buildCommentResponsePrompt(
          account.system_prompt,
          post.caption,
          comment.author_username,
          comment.body,
          sentiment.sentiment
        )
      );
      const response = parseCommentResponse(responseResult.response.text());

      await supabase.from('comments').update({
        sentiment: sentiment.sentiment,
        priority_score: sentiment.priority_score,
        is_business_inquiry: sentiment.is_business_inquiry || response.is_business_inquiry,
        detected_intent: sentiment.detected_intent,
        ai_response_draft: response.reply,
        response_status: response.reply ? 'ai_drafted' : 'unread',
      }).eq('id', comment.id);

    } catch {
      // Skip failed AI processing
    }
  }
}
