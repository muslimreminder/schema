import { z } from 'zod';
import { AttributionSchema, LanguageCodeSchema } from '../../common/index.js';
import { ContentSchemaVersionSchema } from '../version.js';
import { QURAN_SURAH_COUNT, QURAN_VERSE_COUNTS } from './structure.js';
import { QuranTranslationIdSchema } from './translation.js';

/** A tafsir (exegesis) in one language. A language can have several, e.g. a full one and an abridged one. */
export const QuranTafsirSchema = z.object({
    /** Slug like the translations', e.g. `en-ibn-kathir`. Stable: apps store it as a preference. */
    id: QuranTranslationIdSchema,
    language: LanguageCodeSchema,
    /** Name of the work, e.g. `Tafsir Ibn Kathir`. */
    name: z.string().min(1),
    /** Author, e.g. `Ismail ibn Kathir`; absent when the work is collective. */
    author: z.string().min(1).optional(),
    /** Verses explained by a passage; some tafsirs leave a few verses out. */
    verseCount: z.number().int().nonnegative(),
    attribution: AttributionSchema,
});
export type QuranTafsir = z.infer<typeof QuranTafsirSchema>;

/** File `quran/tafsirs`: the catalog of published tafsirs. */
export const QuranTafsirsFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        tafsirs: z.array(QuranTafsirSchema),
    })
    .superRefine((file, ctx) => {
        const seen = new Set<string>();
        file.tafsirs.forEach((tafsir, index) => {
            if (seen.has(tafsir.id)) {
                ctx.addIssue({ code: 'custom', message: `Duplicate tafsir "${tafsir.id}"`, path: ['tafsirs', index, 'id'] });
            }
            seen.add(tafsir.id);
        });
    });
export type QuranTafsirsFile = z.infer<typeof QuranTafsirsFileSchema>;

/**
 * A block of a passage, in reading order. Plain text: no HTML, no inline emphasis; Quran quotes stay
 * inline, between ornate brackets `﴿…﴾` when the source has them.
 */
export const QuranTafsirBlockSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('heading'), text: z.string().min(1) }),
    z.object({ type: z.literal('paragraph'), text: z.string().min(1) }),
    z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(z.string().min(1)).min(1) }),
    /** The explained verses as the author quotes them, usually their translation. */
    z.object({ type: z.literal('quote'), text: z.string().min(1) }),
]);
export type QuranTafsirBlock = z.infer<typeof QuranTafsirBlockSchema>;

/** The commentary of verses `from` to `to` of a surah (both included): tafsirs often explain verses together. */
export const QuranTafsirPassageSchema = z.object({
    from: z.number().int().positive(),
    to: z.number().int().positive(),
    blocks: z.array(QuranTafsirBlockSchema).min(1),
});
export type QuranTafsirPassage = z.infer<typeof QuranTafsirPassageSchema>;

/**
 * File `quran/tafsirs/{id}`: a whole tafsir, downloaded at once. `surahs[s - 1]` holds the passages of
 * surah `s`, ordered and without overlap; a verse no passage covers has no commentary.
 */
export const QuranTafsirFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        tafsir: QuranTafsirSchema,
        surahs: z.array(z.array(QuranTafsirPassageSchema)).length(QURAN_SURAH_COUNT),
    })
    .superRefine((file, ctx) => {
        let verses = 0;
        file.surahs.forEach((passages, index) => {
            const verseCount = QURAN_VERSE_COUNTS[index]!;
            passages.forEach((passage, passageIndex) => {
                const path = ['surahs', index, passageIndex];
                if (passage.to < passage.from || passage.to > verseCount) {
                    ctx.addIssue({ code: 'custom', message: `Verses ${passage.from}-${passage.to} out of surah ${index + 1}`, path });
                }
                if (passageIndex > 0 && passage.from <= passages[passageIndex - 1]!.to) {
                    ctx.addIssue({ code: 'custom', message: 'Passages must be ordered and must not overlap', path });
                }
                verses += passage.to - passage.from + 1;
            });
        });
        if (verses !== file.tafsir.verseCount) {
            ctx.addIssue({ code: 'custom', message: `verseCount must be ${verses}`, path: ['tafsir', 'verseCount'] });
        }
    });
export type QuranTafsirFile = z.infer<typeof QuranTafsirFileSchema>;
