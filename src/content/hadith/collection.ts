import { z } from 'zod';
import { AttributionSchema, LanguageCodeSchema, LocalizedTextSchema } from '../../common/index.js';
import { ContentSchemaVersionSchema } from '../version.js';

/** Collection slug, e.g. `bukhari`, `muslim`, `riyadussalihin` (sunnah.com naming). */
export const HadithCollectionIdSchema = z.string().regex(/^[a-z0-9]+$/, 'Expected a lowercase slug');
export type HadithCollectionId = z.infer<typeof HadithCollectionIdSchema>;

export const HadithCollectionSchema = z.object({
    id: HadithCollectionIdSchema,
    name: LocalizedTextSchema,
    shortIntro: LocalizedTextSchema.optional(),
    bookCount: z.number().int().nonnegative(),
    hadithCount: z.number().int().nonnegative(),
    /** Languages in which the hadith texts of this collection are available. */
    languages: z.array(LanguageCodeSchema).min(1),
    attribution: AttributionSchema,
});
export type HadithCollection = z.infer<typeof HadithCollectionSchema>;

/** File `hadith/collections`: every published collection. */
export const HadithCollectionsFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        collections: z.array(HadithCollectionSchema),
    })
    .superRefine((file, ctx) => {
        const seen = new Set<string>();
        file.collections.forEach((collection, index) => {
            if (seen.has(collection.id)) {
                ctx.addIssue({ code: 'custom', message: `Duplicate collection "${collection.id}"`, path: ['collections', index, 'id'] });
            }
            seen.add(collection.id);
        });
    });
export type HadithCollectionsFile = z.infer<typeof HadithCollectionsFileSchema>;
