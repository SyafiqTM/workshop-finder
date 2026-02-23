import { z } from 'zod';

export const createWorkshopSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(4),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().min(6),
  description: z.string().min(10),
  images: z.string().url()
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().optional()
});
