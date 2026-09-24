import { z } from 'zod';
import { LanguageCodeSchema, LocalizedTextSchema } from '../../common/index.js';
import { ContentSchemaVersionSchema } from '../version.js';
import { HadithBookIdSchema, HadithBookSchema } from './book.js';
import { HadithCollectionIdSchema } from './collection.js';

export const HadithGradeSchema = z.object({
    /** e.g. `Sahih`, `Hasan`, `Da'if`. Free text: wording differs between scholars. */
    grade: z.string().min(1),
    /** Scholar who gave the grade, `null` when the source does not say. */
    gradedBy: z.string().min(1).nullable(),
});
export type HadithGrade = z.infer<typeof HadithGradeSchema>;

/** Chain of narrators (`sanad`) or content (`matan`). */
export const HadithSegmentSchema = z.object({
    type: z.enum(['sanad', 'matan']),
    text: z.string().min(1),
});
export type HadithSegment = z.infer<typeof HadithSegmentSchema>;

/** The hadith in one language. Text is plain (no HTML); paragraphs are separated by a blank line. */
export const HadithTextSchema = z.object({
    /** Narrator line, e.g. `Narrated 'Umar bin Al-Khattab:`. */
    narrator: z.string().min(1).optional(),
    body: z.string().min(1),
    /** Sanad/matan split of `body`, when the source provides it. */
    segments: z.array(HadithSegmentSchema).min(1).optional(),
    grades: z.array(HadithGradeSchema),
});
export type HadithText = z.infer<typeof HadithTextSchema>;

export const HadithSchema = z.object({
    /**
     * Stable identifier, unique in the collection (sunnah.com: the Arabic URN).
     * Use it for favorites and links: `number` is not unique.
     */
    id: z.string().min(1),
    collectionId: HadithCollectionIdSchema,
    bookId: HadithBookIdSchema,
    /**
     * Hadith number as printed in the collection. A string (`"12a"`), and not unique:
     * a hadith and its alternative chain can share the same number.
     */
    number: z.string().min(1),
    chapterId: z.string().min(1).optional(),
    texts: z
        .record(LanguageCodeSchema, HadithTextSchema)
        .refine((value) => Object.keys(value).length > 0, 'Expected at least one language'),
});
export type Hadith = z.infer<typeof HadithSchema>;

export const HadithChapterSchema = z.object({
    /** Chapter identifier inside the book, e.g. `"1.00"` on sunnah.com. */
    id: z.string().min(1),
    title: LocalizedTextSchema,
    intro: LocalizedTextSchema.optional(),
});
export type HadithChapter = z.infer<typeof HadithChapterSchema>;

/** File `hadith/{collectionId}/books/{bookId}`: one book with its chapters and hadiths. */
export const HadithBookFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        collectionId: HadithCollectionIdSchema,
        book: HadithBookSchema,
        chapters: z.array(HadithChapterSchema),
        hadiths: z.array(HadithSchema),
    })
    .superRefine((file, ctx) => {
        const chapterIds = new Set(file.chapters.map((chapter) => chapter.id));
        const ids = new Set<string>();
        file.hadiths.forEach((hadith, index) => {
            const path = ['hadiths', index];
            if (hadith.collectionId !== file.collectionId) {
                ctx.addIssue({ code: 'custom', message: `collectionId must be "${file.collectionId}"`, path: [...path, 'collectionId'] });
            }
            if (hadith.bookId !== file.book.id) {
                ctx.addIssue({ code: 'custom', message: `bookId must be "${file.book.id}"`, path: [...path, 'bookId'] });
            }
            if (hadith.chapterId !== undefined && !chapterIds.has(hadith.chapterId)) {
                ctx.addIssue({ code: 'custom', message: `Unknown chapter "${hadith.chapterId}"`, path: [...path, 'chapterId'] });
            }
            if (ids.has(hadith.id)) {
                ctx.addIssue({ code: 'custom', message: `Duplicate hadith id "${hadith.id}"`, path: [...path, 'id'] });
            }
            ids.add(hadith.id);
        });
    });
export type HadithBookFile = z.infer<typeof HadithBookFileSchema>;
