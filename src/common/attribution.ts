import { z } from 'zod';

/** Where a dataset comes from. Required on every published dataset. */
export const AttributionSchema = z.object({
    /** Human-readable source name, e.g. `sunnah.com`. */
    source: z.string().min(1),
    sourceUrl: z.url().optional(),
    /** SPDX identifier or free-text license / terms of use. */
    license: z.string().min(1).optional(),
    /** Upstream version or revision, when the source exposes one. */
    sourceVersion: z.string().min(1).optional(),
    /** When the ETL fetched the data (ISO 8601). */
    retrievedAt: z.iso.datetime(),
});
export type Attribution = z.infer<typeof AttributionSchema>;
