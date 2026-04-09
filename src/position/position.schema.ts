import { z } from 'zod';

export const CreatePositionSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(160).optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreatePositionInput = z.infer<typeof CreatePositionSchema>;

export const UpdatePositionSchema = CreatePositionSchema.partial();
export type UpdatePositionInput = z.infer<typeof UpdatePositionSchema>;

const booleanFromString = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const ListPositionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().optional().default('createdAt:desc'),
  q: z.string().optional(),
  search: z.string().optional(),
  isActive: booleanFromString.optional(),
});

export type ListPositionsQuery = z.infer<typeof ListPositionsQuerySchema>;
