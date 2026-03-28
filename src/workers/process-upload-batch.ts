import type { Job } from 'bullmq';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { geminiModel } from '@/lib/gemini/client';
import { buildCaptionPrompt } from '@/lib/gemini/prompts';
import { parseCaptionResponse } from '@/lib/gemini/parse';

interface ProcessUploadBatchData {
  batchId: string;
}

export async function processUploadBatch(job: Job<ProcessUploadBatchData>) {
  const supabase = createServiceRoleClient();
  const { batchId } = job.data;

  const { data: batch } = await supabase
    .from('upload_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (!batch) throw new Error(`Batch ${batchId} not found`);

  await supabase.from('upload_batches').update({ status: 'processing' }).eq('id', batchId);

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('upload_batch_id', batchId);

  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', batch.account_id)
    .single();

  if (!posts || !account) throw new Error('Missing posts or account');

  let processedFiles = 0;
  let failedFiles = 0;
  const errorLog: Array<{ file: string; error: string }> = [];

  await supabase.from('upload_batches').update({ status: 'caption_generation' }).eq('id', batchId);

  for (const post of posts) {
    try {
      const mediaUrl = post.media_urls[0] ?? 'image content';
      const prompt = buildCaptionPrompt(
        account.system_prompt,
        account.tone_keywords,
        mediaUrl
      );

      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      const { caption, topics, hashtags, alt_text } = parseCaptionResponse(text);

      let matchedClientId: string | null = null;
      if (topics.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, topic_keywords')
          .eq('user_id', account.user_id)
          .eq('is_active', true);

        if (clients) {
          for (const client of clients) {
            const overlap = topics.some((t) =>
              client.topic_keywords.some(
                (kw) => kw.toLowerCase() === t.toLowerCase()
              )
            );
            if (overlap) {
              matchedClientId = client.id;
              break;
            }
          }
        }
      }

      await supabase.from('posts').update({
        caption,
        detected_topics: topics,
        hashtags,
        alt_text,
        client_id: matchedClientId,
        status: 'draft',
      }).eq('id', post.id);

      processedFiles++;
    } catch (error) {
      failedFiles++;
      errorLog.push({
        file: post.media_urls[0] ?? 'unknown',
        error: (error as Error).message,
      });
    }

    await supabase.from('upload_batches').update({
      processed_files: processedFiles,
      failed_files: failedFiles,
      error_log: errorLog,
    }).eq('id', batchId);
  }

  const finalStatus = failedFiles > 0
    ? (processedFiles > 0 ? 'partial_failure' : 'failed')
    : 'completed';

  await supabase.from('upload_batches').update({ status: finalStatus }).eq('id', batchId);
}
