import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const rateLimiters = {
  apiGeneral: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1m'),
    prefix: 'rl_api_general',
  }),
  apiUpload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1h'),
    prefix: 'rl_api_upload',
  }),
  apiAiGeneration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1m'),
    prefix: 'rl_api_ai',
  }),
  instagramPublish: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(25, '1h'),
    prefix: 'rl_ig_publish',
  }),
  instagramRead: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, '1h'),
    prefix: 'rl_ig_read',
  }),
  instagramComment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1h'),
    prefix: 'rl_ig_comment',
  }),
};

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export { redis };
