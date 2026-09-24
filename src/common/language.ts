import { z } from 'zod';

/** Lowercase ISO 639-1/639-3 language code, e.g. `ar`, `en`, `fr`. */
export const LanguageCodeSchema = z
    .string()
    .regex(/^[a-z]{2,3}$/, 'Expected a lowercase ISO 639 language code (e.g. "ar", "en")');
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

/** Text available in one or more languages, keyed by language code. At least one entry. */
export const LocalizedTextSchema = z
    .record(LanguageCodeSchema, z.string().min(1))
    .refine((value) => Object.keys(value).length > 0, 'Expected at least one language');
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;
