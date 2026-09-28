import { z } from 'zod';
import { AttributionSchema, LanguageCodeSchema } from '../../common/index.js';
import { ContentSchemaVersionSchema } from '../version.js';
import { QURAN_SURAH_COUNT, QURAN_VERSE_COUNTS } from './structure.js';
import { QuranTranslationIdSchema } from './translation.js';

export const QuranWordTranslationSchema = z.object({
    /** Slug like the verse translations', e.g. `fr-wbw`. */
    id: QuranTranslationIdSchema,
    language: LanguageCodeSchema,
    name: z.string().min(1),
    /** Words that have a translation; some sources leave particles untranslated. */
    translatedWordCount: z.number().int().nonnegative(),
    attribution: AttributionSchema,
});
export type QuranWordTranslation = z.infer<typeof QuranWordTranslationSchema>;

/** File `quran/word-translations`: the catalog of published word-by-word translations. */
export const QuranWordTranslationsFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        translations: z.array(QuranWordTranslationSchema),
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
export type QuranWordTranslationsFile = z.infer<typeof QuranWordTranslationsFileSchema>;

/**
 * File `quran/word-translations/{id}`: `surahs[s - 1][v - 1][w - 1]` translates word `w` of verse `s:v`,
 * words counted in reading order (verse end markers excluded). `null` when the source has none for it.
 */
export const QuranWordTranslationFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        translation: QuranWordTranslationSchema,
        surahs: z.array(z.array(z.array(z.string().min(1).nullable()).min(1))).length(QURAN_SURAH_COUNT),
    })
    .superRefine((file, ctx) => {
        file.surahs.forEach((verses, index) => {
            const expected = QURAN_VERSE_COUNTS[index];
            if (verses.length !== expected) {
                ctx.addIssue({ code: 'custom', message: `Surah ${index + 1} must have ${expected} verses, got ${verses.length}`, path: ['surahs', index] });
            }
        });
        const translated = file.surahs.flat(2).filter((word) => word !== null).length;
        if (translated !== file.translation.translatedWordCount) {
            ctx.addIssue({ code: 'custom', message: `translatedWordCount must be ${translated}`, path: ['translation', 'translatedWordCount'] });
        }
    });
export type QuranWordTranslationFile = z.infer<typeof QuranWordTranslationFileSchema>;
