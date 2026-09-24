import { z } from 'zod';
import { COUNTRIES } from './countries';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const dayHoursSchema = z
  .object({ open: z.string().regex(TIME_RE), close: z.string().regex(TIME_RE) })
  .nullable()
  .refine((d) => d === null || d.open < d.close, {
    message: 'La hora de apertura debe ser anterior a la de cierre',
  });

export const businessHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

export const countryCodeSchema = z
  .string()
  .length(2)
  .refine((code) => COUNTRIES.some((c) => c.code === code), {
    message: 'Pais no soportado',
  });
