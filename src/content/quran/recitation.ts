import { z } from 'zod';
import { AttributionSchema } from '../../common/index.js';
import { ContentSchemaVersionSchema } from '../version.js';
import { QURAN_SURAH_COUNT, QURAN_VERSE_COUNTS } from './structure.js';

/** Reciter slug, e.g. `al-husary`. Stable: apps store it as a preference. */
export const QuranRecitationIdSchema = z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a slug like "al-husary"');
export type QuranRecitationId = z.infer<typeof QuranRecitationIdSchema>;

/**
 * How the Quran is recited: `murattal` is the measured reading apps play verse by verse, `mujawwad`
 * the melodic one. Only the recitation style changes, never the text.
 */
export const QuranRecitationStyleSchema = z.enum(['murattal', 'mujawwad']);
export type QuranRecitationStyle = z.infer<typeof QuranRecitationStyleSchema>;

/** A recitation of the whole Quran, one audio file per verse. */
export const QuranRecitationSchema = z.object({
    id: QuranRecitationIdSchema,
    /** Reciter, e.g. `Mahmoud Khalil Al-Husary`. */
    reciter: z.string().min(1),
    style: QuranRecitationStyleSchema,
    /** Verses whose audio is timed word by word; the others are only played whole. */
    timedVerseCount: z.number().int().nonnegative(),
    attribution: AttributionSchema,
});
export type QuranRecitation = z.infer<typeof QuranRecitationSchema>;

/** File `quran/recitations`: the catalog of published recitations. */
export const QuranRecitationsFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        recitations: z.array(QuranRecitationSchema),
    })
    .superRefine((file, ctx) => {
        const seen = new Set<string>();
        file.recitations.forEach((recitation, index) => {
            if (seen.has(recitation.id)) {
                ctx.addIssue({ code: 'custom', message: `Duplicate recitation "${recitation.id}"`, path: ['recitations', index, 'id'] });
            }
            seen.add(recitation.id);
        });
    });
export type QuranRecitationsFile = z.infer<typeof QuranRecitationsFileSchema>;

/**
 * When a word is recited: `[word, start, end]`, the word numbered from 1 in its verse (verse end
 * markers excluded, as in the word-by-word translations), in milliseconds from the start of the
 * verse's audio file.
 */
export const QuranWordTimingSchema = z.tuple([
    z.number().int().positive(),
    z.number().int().nonnegative(),
    z.number().int().nonnegative(),
]);
export type QuranWordTiming = z.infer<typeof QuranWordTimingSchema>;

/** The audio of one verse: how long it lasts, and when each of its words is recited. */
export const QuranVerseRecitationSchema = z.object({
    /** Length of the audio file in milliseconds, when the source gives it. */
    duration: z.number().int().positive().optional(),
    /**
     * Ordered by start, and never two for the same word. Empty when the source times the verse as a
     * whole: the verse is then played without following the words.
     */
    words: z.array(QuranWordTimingSchema),
});
export type QuranVerseRecitation = z.infer<typeof QuranVerseRecitationSchema>;

/**
 * File `quran/recitations/{id}`: the timings of a whole recitation, downloaded at once.
 * `surahs[s - 1][v - 1]` is verse `s:v`. The audio itself is one file per verse, at
 * `quranVerseAudioPath(id, s, v)` under the content root.
 */
export const QuranRecitationFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        recitation: QuranRecitationSchema,
        surahs: z.array(z.array(QuranVerseRecitationSchema)).length(QURAN_SURAH_COUNT),
    })
    .superRefine((file, ctx) => {
        file.surahs.forEach((verses, index) => {
            const expected = QURAN_VERSE_COUNTS[index];
            if (verses.length !== expected) {
                ctx.addIssue({ code: 'custom', message: `Surah ${index + 1} must have ${expected} verses, got ${verses.length}`, path: ['surahs', index] });
                return;
            }
            verses.forEach((verse, verseIndex) => {
                const path = ['surahs', index, verseIndex, 'words'];
                const starts = verse.words.map((word) => word[1]);
                if (starts.some((start, i) => i > 0 && start < starts[i - 1]!)) {
                    ctx.addIssue({ code: 'custom', message: 'Word timings must be ordered by start', path });
                }
                if (verse.words.some(([, start, end]) => end < start)) {
                    ctx.addIssue({ code: 'custom', message: 'A word cannot end before it starts', path });
                }
                if (new Set(verse.words.map((word) => word[0])).size !== verse.words.length) {
                    ctx.addIssue({ code: 'custom', message: 'A word can only be timed once', path });
                }
            });
        });
        const timed = file.surahs.flat().filter((verse) => verse.words.length > 0).length;
        if (timed !== file.recitation.timedVerseCount) {
            ctx.addIssue({ code: 'custom', message: `timedVerseCount must be ${timed}`, path: ['recitation', 'timedVerseCount'] });
        }
    });
export type QuranRecitationFile = z.infer<typeof QuranRecitationFileSchema>;
