import { z } from 'zod';
import { AttributionSchema, LanguageCodeSchema } from '../../common/index.js';
import { ContentSchemaVersionSchema } from '../version.js';
import { QURAN_SURAH_COUNT } from './structure.js';
import { QuranTranslationIdSchema } from './translation.js';

/** A source of surah introductions (name, period of revelation, themes…), one per language. */
export const QuranSurahInfoSchema = z.object({
    /** Slug like the translations', e.g. `en-maududi`. */
    id: QuranTranslationIdSchema,
    language: LanguageCodeSchema,
    /** Author or work, e.g. `Abul Ala Maududi`. */
    name: z.string().min(1),
    /** Surahs that have an introduction; some sources skip a few. */
    surahCount: z.number().int().nonnegative(),
    attribution: AttributionSchema,
});
export type QuranSurahInfo = z.infer<typeof QuranSurahInfoSchema>;

/** File `quran/surah-infos`: the catalog of published surah introductions. */
export const QuranSurahInfosFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        infos: z.array(QuranSurahInfoSchema),
    })
    .superRefine((file, ctx) => {
        const seen = new Set<string>();
        file.infos.forEach((info, index) => {
            if (seen.has(info.id)) {
                ctx.addIssue({ code: 'custom', message: `Duplicate surah info "${info.id}"`, path: ['infos', index, 'id'] });
            }
            seen.add(info.id);
        });
    });
export type QuranSurahInfosFile = z.infer<typeof QuranSurahInfosFileSchema>;

/** A block of an introduction, in reading order. Plain text: no HTML, no inline emphasis. */
export const QuranSurahInfoBlockSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('heading'), text: z.string().min(1) }),
    z.object({ type: z.literal('paragraph'), text: z.string().min(1) }),
    z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(z.string().min(1)).min(1) }),
]);
export type QuranSurahInfoBlock = z.infer<typeof QuranSurahInfoBlockSchema>;

/** The introduction of one surah. */
export const QuranSurahIntroductionSchema = z.object({
    /** A one-paragraph summary, when the source has one. */
    summary: z.string().min(1).optional(),
    blocks: z.array(QuranSurahInfoBlockSchema).min(1),
});
export type QuranSurahIntroduction = z.infer<typeof QuranSurahIntroductionSchema>;

/**
 * File `quran/surah-infos/{id}`: `surahs[s - 1]` introduces surah `s`, `null` when the source has nothing
 * usable for it.
 */
export const QuranSurahInfoFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        info: QuranSurahInfoSchema,
        surahs: z.array(QuranSurahIntroductionSchema.nullable()).length(QURAN_SURAH_COUNT),
    })
    .superRefine((file, ctx) => {
        const count = file.surahs.filter((surah) => surah !== null).length;
        if (count !== file.info.surahCount) {
            ctx.addIssue({ code: 'custom', message: `surahCount must be ${count}`, path: ['info', 'surahCount'] });
        }
    });
export type QuranSurahInfoFile = z.infer<typeof QuranSurahInfoFileSchema>;
