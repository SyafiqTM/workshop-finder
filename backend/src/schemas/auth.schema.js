import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Missing Google credential')
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().max(20).optional().nullable(),
  carModel: z.string().max(100).optional().nullable(),
  birthday: z.string().optional().nullable()
});
