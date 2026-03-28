import { z } from 'zod';

export const createAccountSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(100),
  system_prompt: z.string().default(''),
  tone_keywords: z.array(z.string()).default([]),
  bio: z.string().optional(),
  posting_schedule: z.object({
    times: z.array(z.string()),
    timezone: z.string(),
    max_per_day: z.number().min(1).max(25),
  }).default({ times: ['09:00', '12:00', '18:00'], timezone: 'UTC', max_per_day: 3 }),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
