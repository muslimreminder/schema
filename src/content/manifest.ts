import { z } from 'zod';
import { ContentSchemaVersionSchema } from './version.js';

/** A published file, addressed by a content-hashed path so it can be cached forever. */
export const ManifestFileSchema = z.object({
    /** Path relative to the content root (`/v1/`), e.g. `hadith/bukhari/books/1.3f2a9c1b.json`. */
    path: z.string().regex(/^[a-z0-9][a-z0-9/_.-]*\.json$/, 'Expected a relative .json path'),
    sha256: z.string().regex(/^[a-f0-9]{64}$/, 'Expected a lowercase hex SHA-256'),
    bytes: z.number().int().nonnegative(),
});
export type ManifestFile = z.infer<typeof ManifestFileSchema>;

/**
 * Entry point of the CDN (`/v1/manifest.json`, short cache). Maps logical keys
 * (see `contentKeys`) to their current hashed file. Clients diff it against their local copy
 * and download only the files whose hash changed.
 */
export const ManifestSchema = z.object({
    schemaVersion: ContentSchemaVersionSchema,
    generatedAt: z.iso.datetime(),
    files: z.record(z.string().min(1), ManifestFileSchema),
});
export type Manifest = z.infer<typeof ManifestSchema>;

export const MANIFEST_PATH = 'manifest.json';
