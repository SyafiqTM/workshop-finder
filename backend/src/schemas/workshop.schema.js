import { z } from 'zod';

const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createWorkshopSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(4),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().min(6),
  opensAt: z.string().regex(hhmmRegex, 'opensAt must be HH:mm'),
  closesAt: z.string().regex(hhmmRegex, 'closesAt must be HH:mm'),
  schedule: z.string().optional(),
  description: z.string().min(10),
  images: z.string().min(1)
}).refine((data) => data.city || data.state, { message: 'State is required', path: ['state'] });

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().optional()
});
