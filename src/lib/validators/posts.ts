import { z } from 'zod';

export const createPostSchema = z.object({
  account_id: z.string().uuid(),
  media_type: z.enum(['image', 'video', 'carousel', 'reel']),
  media_urls: z.array(z.string()).min(1),
  caption: z.string().max(2200).default(''),
  hashtags: z.array(z.string()).default([]),
  alt_text: z.string().optional(),
  location_tag: z.string().optional(),
  client_id: z.string().uuid().optional().nullable(),
});

export const updatePostSchema = z.object({
  caption: z.string().max(2200).optional(),
  hashtags: z.array(z.string()).optional(),
  alt_text: z.string().optional(),
  location_tag: z.string().optional(),
  client_id: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'pending_review', 'approved', 'scheduled', 'archived']).optional(),
});

export const schedulePostSchema = z.object({
  scheduled_at: z.string().datetime(),
  priority: z.number().int().min(0).default(0),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type SchedulePostInput = z.infer<typeof schedulePostSchema>;
