import { z } from 'zod';
import { LocalizedTextSchema } from '../../common/index.js';
import { ContentSchemaVersionSchema } from '../version.js';
import { HadithCollectionIdSchema } from './collection.js';

/** Book identifier inside a collection. A string: sunnah.com uses values like `"1"` or `"introduction"`. */
export const HadithBookIdSchema = z.string().min(1);

export const HadithBookSchema = z.object({
    id: HadithBookIdSchema,
    /** Display order inside the collection, starting at 1. */
    order: z.number().int().positive(),
    name: LocalizedTextSchema,
    hadithCount: z.number().int().nonnegative(),
    /** First and last hadith numbers of the book, when the numbering is contiguous. */
    numberRange: z
        .object({ first: z.number().int().nonnegative(), last: z.number().int().nonnegative() })
        .refine((range) => range.first <= range.last, 'first must be <= last')
        .optional(),
});
export type HadithBook = z.infer<typeof HadithBookSchema>;

/** File `hadith/{collectionId}/books`: the table of contents of a collection. */
export const HadithBooksFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        collectionId: HadithCollectionIdSchema,
        books: z.array(HadithBookSchema),
    })
    .superRefine((file, ctx) => {
        const seen = new Set<string>();
        file.books.forEach((book, index) => {
            if (seen.has(book.id)) {
                ctx.addIssue({ code: 'custom', message: `Duplicate book "${book.id}"`, path: ['books', index, 'id'] });
            }
            seen.add(book.id);
        });
    });
export type HadithBooksFile = z.infer<typeof HadithBooksFileSchema>;
