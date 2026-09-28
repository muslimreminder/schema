import { z } from 'zod';
import { AttributionSchema, LanguageCodeSchema } from '../../common/index.js';
import { ContentSchemaVersionSchema } from '../version.js';
import { QURAN_SURAH_COUNT, QURAN_VERSE_COUNTS } from './structure.js';

/** Translation slug, `{language}-{translator}`, e.g. `fr-hamidullah`. Stable: apps store it as a preference. */
export const QuranTranslationIdSchema = z
    .string()
    .regex(/^[a-z]{2,3}-[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a slug like "fr-hamidullah"');
export type QuranTranslationId = z.infer<typeof QuranTranslationIdSchema>;

export const QuranTranslationSchema = z.object({
    id: QuranTranslationIdSchema,
    language: LanguageCodeSchema,
    /** Display name, e.g. `Muhammad Hamidullah`. */
    name: z.string().min(1),
    /** Number of verses carrying at least one footnote; 0 when the translation has none. */
    footnotedVerseCount: z.number().int().nonnegative(),
    attribution: AttributionSchema,
});
export type QuranTranslation = z.infer<typeof QuranTranslationSchema>;

/** File `quran/translations`: the catalog of published verse-by-verse translations. */
export const QuranTranslationsFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        translations: z.array(QuranTranslationSchema),
    })
    .superRefine((file, ctx) => {
        const seen = new Set<string>();
        file.translations.forEach((translation, index) => {
            if (seen.has(translation.id)) {
                ctx.addIssue({ code: 'custom', message: `Duplicate translation "${translation.id}"`, path: ['translations', index, 'id'] });
            }
            seen.add(translation.id);
        });
    });
export type QuranTranslationsFile = z.infer<typeof QuranTranslationsFileSchema>;

/** A translator's note. `offset` is where its marker goes in the verse text (UTF-16 index, 0 = before the text). */
export const QuranFootnoteSchema = z.object({
    offset: z.number().int().nonnegative(),
    /** Plain text; paragraphs are separated by a blank line. */
    text: z.string().min(1),
});
export type QuranFootnote = z.infer<typeof QuranFootnoteSchema>;

/** One translated verse. Plain text (no HTML, no footnote markers). */
export const QuranVerseTranslationSchema = z.object({
    text: z.string().min(1),
    /** Ordered by offset. Absent when the verse has none. */
    footnotes: z.array(QuranFootnoteSchema).min(1).optional(),
});
export type QuranVerseTranslation = z.infer<typeof QuranVerseTranslationSchema>;

/**
 * File `quran/translations/{id}`: a whole translation, downloaded at once.
 * `surahs[s - 1][v - 1]` is verse `s:v`.
 */
export const QuranTranslationFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        translation: QuranTranslationSchema,
        surahs: z.array(z.array(QuranVerseTranslationSchema)).length(QURAN_SURAH_COUNT),
    })
    .superRefine((file, ctx) => {
        file.surahs.forEach((verses, index) => {
            const expected = QURAN_VERSE_COUNTS[index];
            if (verses.length !== expected) {
                ctx.addIssue({ code: 'custom', message: `Surah ${index + 1} must have ${expected} verses, got ${verses.length}`, path: ['surahs', index] });
            }
            verses.forEach((verse, verseIndex) => {
                const offsets = (verse.footnotes ?? []).map((footnote) => footnote.offset);
                const path = ['surahs', index, verseIndex, 'footnotes'];
                if (offsets.some((offset) => offset > verse.text.length)) {
                    ctx.addIssue({ code: 'custom', message: 'Footnote offset past the end of the text', path });
                }
                if (offsets.some((offset, i) => i > 0 && offset < offsets[i - 1]!)) {
                    ctx.addIssue({ code: 'custom', message: 'Footnotes must be ordered by offset', path });
                }
            });
        });
        const footnoted = file.surahs.flat().filter((verse) => verse.footnotes).length;
        if (footnoted !== file.translation.footnotedVerseCount) {
            ctx.addIssue({ code: 'custom', message: `footnotedVerseCount must be ${footnoted}`, path: ['translation', 'footnotedVerseCount'] });
        }
    });
export type QuranTranslationFile = z.infer<typeof QuranTranslationFileSchema>;
