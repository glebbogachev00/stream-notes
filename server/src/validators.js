import { z } from 'zod';

const itemSchema = z.object({
  key: z.string().min(1),
  value: z.string().nullable().optional(),
  updatedAt: z.number().int().nonnegative(),
  deletedAt: z.number().int().nonnegative().nullable().optional()
});

const pushPayloadSchema = z.object({
  userId: z.string().min(1),
  items: z.array(itemSchema).default([])
});

const pullPayloadSchema = z.object({
  userId: z.string().min(1),
  since: z.number().int().nonnegative().default(0)
});

export {
  itemSchema,
  pushPayloadSchema,
  pullPayloadSchema
};
