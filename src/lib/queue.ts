import { Queue, Worker, type Job, type WorkerOptions, type QueueOptions } from 'bullmq';
import { createServiceRoleClient } from '@/lib/supabase/server';

const connection = {
  host: new URL(process.env.UPSTASH_REDIS_URL ?? 'https://localhost').hostname,
  port: 6379,
  password: process.env.UPSTASH_REDIS_TOKEN,
  tls: {},
};

const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
  },
};

export function createQueue(name: string, options?: Partial<QueueOptions>): Queue {
  return new Queue(name, { ...defaultQueueOptions, ...options });
}

export function createWorker<T>(
  name: string,
  processor: (job: Job<T>) => Promise<void>,
  options?: Partial<WorkerOptions>
): Worker<T> {
  const worker = new Worker<T>(name, processor, {
    connection,
    concurrency: 1,
    ...options,
  });

  worker.on('completed', async (job) => {
    if (!job) return;
    const supabase = createServiceRoleClient();
    const startedAt = job.processedOn ?? Date.now();
    await supabase.from('job_logs').insert({
      job_name: name,
      job_id: job.id ?? null,
      status: 'completed' as const,
      payload: JSON.parse(JSON.stringify(job.data ?? {})),
      result: JSON.parse(JSON.stringify(job.returnvalue ?? {})),
      duration_ms: Date.now() - startedAt,
      completed_at: new Date().toISOString(),
    });
  });

  worker.on('failed', async (job, err) => {
    if (!job) return;
    const supabase = createServiceRoleClient();
    const status = job.attemptsMade < (job.opts?.attempts ?? 1) ? 'retrying' : 'failed';
    await supabase.from('job_logs').insert({
      job_name: name,
      job_id: job.id ?? null,
      status: status as 'retrying' | 'failed',
      payload: JSON.parse(JSON.stringify(job.data ?? {})),
      error_message: err.message,
      duration_ms: Date.now() - (job.processedOn ?? Date.now()),
    });
  });

  return worker;
}

export const queues = {
  processUploadBatch: createQueue('process-upload-batch'),
  publishScheduled: createQueue('publish-scheduled'),
  syncMetrics: createQueue('sync-metrics'),
  syncComments: createQueue('sync-comments'),
  detectTopics: createQueue('detect-topics'),
  commentAutoResponse: createQueue('comment-auto-response'),
  deleteUploadedFile: createQueue('delete-uploaded-file'),
  scheduleDistribution: createQueue('schedule-distribution'),
  maintenance: createQueue('maintenance'),
};
