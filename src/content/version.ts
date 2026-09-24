import { z } from 'zod';

/**
 * Version of the published content format. Bump it (and the CDN path prefix, `/v1/` → `/v2/`)
 * only for breaking changes; additive changes keep the same version.
 */
export const CONTENT_SCHEMA_VERSION = 1;
export const CONTENT_PATH_PREFIX = `v${CONTENT_SCHEMA_VERSION}`;

export const ContentSchemaVersionSchema = z.literal(CONTENT_SCHEMA_VERSION);
