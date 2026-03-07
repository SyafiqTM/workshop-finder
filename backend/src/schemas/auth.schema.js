import { z } from 'zod';

const mileageRecordSchema = z.object({
  mileage: z.number().int().nonnegative('Mileage must be 0 or more'),
  recordedAt: z.string().datetime({ offset: true, message: 'Mileage record date must be a valid ISO datetime' }),
  note: z.string().trim().max(120, 'Mileage note must be 120 characters or fewer').optional().nullable()
});

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
  birthday: z.string().optional().nullable(),
  currentMileage: z.number().int().nonnegative('Current mileage must be 0 or more').optional().nullable(),
  lastEngineOilChangeMileage: z.number().int().nonnegative('Engine oil mileage must be 0 or more').optional().nullable(),
  lastAtfChangeMileage: z.number().int().nonnegative('ATF / gearbox oil mileage must be 0 or more').optional().nullable(),
  mileageRecords: z.array(mileageRecordSchema).optional().nullable()
});
