import { z } from 'zod';
import { AttributionSchema } from '../../common/index.js';
import { ContentSchemaVersionSchema } from '../version.js';
import { QuranRecitationIdSchema, QuranWordTimingSchema } from './recitation.js';
import { QURAN_SURAH_COUNT, QURAN_VERSE_COUNTS } from './structure.js';

/**
 * The transmission (riwayah) of the reading the reciter follows. The mushaf of the apps is `hafs`
 * (Hafs `an` Asim): its verse numbering only matches the timings of a `hafs` recitation.
 */
export const QuranRiwayahSchema = z.enum(['hafs', 'shubah', 'warsh', 'qalun', 'al-duri', 'al-susi', 'abu-al-harith']);
export type QuranRiwayah = z.infer<typeof QuranRiwayahSchema>;

/**
 * How a surah is recited: `murattal` measured, `mujawwad` melodic, `muallim` the teaching reading
 * that leaves time to repeat after the reciter.
 */
export const QuranSurahRecitationStyleSchema = z.enum(['murattal', 'mujawwad', 'muallim']);
export type QuranSurahRecitationStyle = z.infer<typeof QuranSurahRecitationStyleSchema>;

/** Where the recitation was recorded, when it is not a studio recording: `taraweeh` = live night prayers of Ramadan. */
export const QuranRecitationOccasionSchema = z.enum(['taraweeh']);
export type QuranRecitationOccasion = z.infer<typeof QuranRecitationOccasionSchema>;

/** A recitation streamed surah by surah: one audio file per surah, played without gaps between the verses. */
export const QuranSurahRecitationSchema = z.object({
    /** Slug, stable: apps store it as a preference. Unrelated to the verse-by-verse recitation ids. */
    id: QuranRecitationIdSchema,
    /** Reciter, e.g. `Mahmoud Khalil Al-Husary`, or the mosque for a taraweeh recording. */
    reciter: z.string().min(1),
    /** Tells two recordings of the same reciter apart, e.g. `1440H` or `Taraweeh 1442H`. */
    label: z.string().min(1).optional(),
    style: QuranSurahRecitationStyleSchema,
    riwayah: QuranRiwayahSchema,
    occasion: QuranRecitationOccasionSchema.optional(),
    /** Surahs that have an audio file; the others are `null` in `quran/surah-recitations/{id}`. */
    surahCount: z.number().int().min(1).max(QURAN_SURAH_COUNT),
    /** Verses located inside their surah's audio; the player follows the verses of these only. */
    timedVerseCount: z.number().int().nonnegative(),
    /** Length of every surah together, in milliseconds. */
    duration: z.number().int().positive(),
    /** Size of every audio file together, when the source gives every size. */
    bytes: z.number().int().positive().optional(),
    attribution: AttributionSchema,
});
export type QuranSurahRecitation = z.infer<typeof QuranSurahRecitationSchema>;

/** File `quran/surah-recitations`: the catalog of the recitations streamed surah by surah. */
export const QuranSurahRecitationsFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        recitations: z.array(QuranSurahRecitationSchema),
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
export type QuranSurahRecitationsFile = z.infer<typeof QuranSurahRecitationsFileSchema>;

/**
 * Where a verse sits in its surah's audio, in milliseconds from the start of the file. `words` uses
 * the same clock (unlike the verse-by-verse recitations, timed from the start of each verse file),
 * and is empty when only the verse is located.
 */
export const QuranSurahVerseTimingSchema = z.object({
    from: z.number().int().nonnegative(),
    to: z.number().int().nonnegative(),
    words: z.array(QuranWordTimingSchema),
});
export type QuranSurahVerseTiming = z.infer<typeof QuranSurahVerseTimingSchema>;

/** The audio file of one surah. */
export const QuranSurahAudioSchema = z.object({
    /** Length in milliseconds. */
    duration: z.number().int().positive(),
    /** Size of the file, when the source gives it. */
    bytes: z.number().int().positive().optional(),
    /**
     * `verses[v - 1]` locates verse `v`, `null` for a verse the source does not locate. Missing when the
     * recitation is not timed at all: the surah is then played as a whole.
     */
    verses: z.array(QuranSurahVerseTimingSchema.nullable()).optional(),
});
export type QuranSurahAudio = z.infer<typeof QuranSurahAudioSchema>;

/**
 * File `quran/surah-recitations/{id}`: the surahs of a recitation, downloaded at once.
 * `surahs[s - 1]` is surah `s`, `null` when the recitation has no audio for it. The audio itself is
 * one file per surah, at `quranSurahAudioPath(id, s)` under the content root.
 */
export const QuranSurahRecitationFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        recitation: QuranSurahRecitationSchema,
        surahs: z.array(QuranSurahAudioSchema.nullable()).length(QURAN_SURAH_COUNT),
    })
    .superRefine((file, ctx) => {
        file.surahs.forEach((surah, index) => {
            if (!surah?.verses) return;
            const expected = QURAN_VERSE_COUNTS[index];
            if (surah.verses.length !== expected) {
                ctx.addIssue({ code: 'custom', message: `Surah ${index + 1} must have ${expected} verses, got ${surah.verses.length}`, path: ['surahs', index, 'verses'] });
                return;
            }
            let previous = 0;
            surah.verses.forEach((verse, verseIndex) => {
                if (!verse) return;
                const path = ['surahs', index, 'verses', verseIndex];
                if (verse.to < verse.from) {
                    ctx.addIssue({ code: 'custom', message: 'A verse cannot end before it starts', path });
                }
                if (verse.from < previous) {
                    ctx.addIssue({ code: 'custom', message: 'Verses must follow each other in the audio', path });
                }
                previous = verse.from;
                const starts = verse.words.map((word) => word[1]);
                if (starts.some((start, i) => i > 0 && start < starts[i - 1]!)) {
                    ctx.addIssue({ code: 'custom', message: 'Word timings must be ordered by start', path: [...path, 'words'] });
                }
                if (verse.words.some(([, start, end]) => end < start)) {
                    ctx.addIssue({ code: 'custom', message: 'A word cannot end before it starts', path: [...path, 'words'] });
                }
                if (new Set(verse.words.map((word) => word[0])).size !== verse.words.length) {
                    ctx.addIssue({ code: 'custom', message: 'A word can only be timed once', path: [...path, 'words'] });
                }
            });
        });

        const surahs = file.surahs.filter((surah) => surah !== null);
        const { recitation } = file;
        const check = (field: 'surahCount' | 'timedVerseCount' | 'duration' | 'bytes', actual: number | undefined) => {
            if (recitation[field] !== actual) {
                ctx.addIssue({ code: 'custom', message: `${field} must be ${actual}`, path: ['recitation', field] });
            }
        };
        check('surahCount', surahs.length);
        check('timedVerseCount', surahs.reduce((count, surah) => count + (surah.verses?.filter(Boolean).length ?? 0), 0));
        check('duration', surahs.reduce((total, surah) => total + surah.duration, 0));
        check('bytes', surahs.every((surah) => surah.bytes) ? surahs.reduce((total, surah) => total + surah.bytes!, 0) : undefined);
    });
export type QuranSurahRecitationFile = z.infer<typeof QuranSurahRecitationFileSchema>;
