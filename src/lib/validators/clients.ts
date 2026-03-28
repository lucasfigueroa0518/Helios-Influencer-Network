import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(200),
  logo_url: z.string().url().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  topic_keywords: z.array(z.string()).default([]),
  hashtag_tracking: z.array(z.string()).default([]),
  campaign_name: z.string().optional().nullable(),
  campaign_start: z.string().optional().nullable(),
  campaign_end: z.string().optional().nullable(),
  campaign_budget: z.number().positive().optional().nullable(),
  campaign_goals: z.record(z.string(), z.unknown()).default({}),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
