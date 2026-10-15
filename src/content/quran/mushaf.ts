import { z } from 'zod';
import { AttributionSchema } from '../../common/index.js';
import { ContentSchemaVersionSchema } from '../version.js';
import { QURAN_SURAH_COUNT, QURAN_VERSE_COUNTS } from './structure.js';

/** Mushaf slug, e.g. `qpc-v4-tajweed`. Stable: apps store it as a preference. */
export const QuranMushafIdSchema = z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a slug like "qpc-v4-tajweed"');
export type QuranMushafId = z.infer<typeof QuranMushafIdSchema>;

/** Pages of a Madinah mushaf. */
export const QURAN_MUSHAF_PAGE_COUNT = 604;

/**
 * A mushaf the apps can download instead of the one they ship: a glyph font per page, where every glyph
 * draws a whole word as printed on that page. Its pages do not always break at the same verses as another
 * print's: a mushaf comes with its own layout.
 */
export const QuranMushafSchema = z.object({
    id: QuranMushafIdSchema,
    /** e.g. `KFGQPC V4 Tajweed (1441H)`. */
    name: z.string().min(1),
    /** The fonts color the letters by tajweed rule. */
    tajweed: z.boolean(),
    lineCount: z.number().int().positive(),
    /** What the 604 page fonts weigh together, the bulk of a download of the mushaf. */
    bytes: z.number().int().positive(),
    attribution: AttributionSchema,
});
export type QuranMushaf = z.infer<typeof QuranMushafSchema>;

/** File `quran/mushafs`: the catalog of downloadable mushafs. */
export const QuranMushafsFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        mushafs: z.array(QuranMushafSchema),
    })
    .superRefine((file, ctx) => {
        const seen = new Set<string>();
        file.mushafs.forEach((mushaf, index) => {
            if (seen.has(mushaf.id)) {
                ctx.addIssue({ code: 'custom', message: `Duplicate mushaf "${mushaf.id}"`, path: ['mushafs', index, 'id'] });
            }
            seen.add(mushaf.id);
        });
    });
export type QuranMushafsFile = z.infer<typeof QuranMushafsFileSchema>;

/**
 * A page font, published next to the layout at a content-hashed path (see `quranMushafFontPath`) and
 * cached forever. The manifest does not list the fonts: the layout file does, with their hash.
 */
export const QuranMushafFontSchema = z.object({
    /** Path relative to the content root, e.g. `quran/mushafs/qpc-v4-tajweed/fonts/003.1a2b3c4d.ttf`. */
    path: z.string().regex(/^quran\/mushafs\/[a-z0-9-]+\/fonts\/\d{3}\.[a-f0-9]{8}\.ttf$/, 'Expected a mushaf font path'),
    sha256: z.string().regex(/^[a-f0-9]{64}$/, 'Expected a lowercase hex SHA-256'),
    bytes: z.number().int().positive(),
});
export type QuranMushafFont = z.infer<typeof QuranMushafFontSchema>;

/**
 * A word of a page line: `[surah, ayah, word, glyphs]`. `word` is numbered from 1 in its verse, as in the
 * word-by-word translations; `0` is the verse-end marker (the circled verse number). `glyphs` is the text
 * to draw with the page font: usually one character, sometimes a few (a word and the pause mark above it).
 */
export const QuranMushafWordSchema = z.tuple([
    z.number().int().min(1).max(QURAN_SURAH_COUNT),
    z.number().int().positive(),
    z.number().int().nonnegative(),
    z.string().min(1),
]);
export type QuranMushafWord = z.infer<typeof QuranMushafWordSchema>;

/** A line of a page: a surah header, the basmala, or words. Headers and the basmala use no page font. */
export const QuranMushafLineSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('surah-name'), surah: z.number().int().min(1).max(QURAN_SURAH_COUNT) }),
    z.object({ type: z.literal('basmala') }),
    z.object({
        type: z.literal('text'),
        /** Short lines (end of a surah, Al-Fatiha) are centered rather than justified. */
        centered: z.boolean(),
        words: z.array(QuranMushafWordSchema).min(1),
    }),
]);
export type QuranMushafLine = z.infer<typeof QuranMushafLineSchema>;

export const QuranMushafPageSchema = z.object({
    font: QuranMushafFontSchema,
    lines: z.array(QuranMushafLineSchema).min(1),
});
export type QuranMushafPage = z.infer<typeof QuranMushafPageSchema>;

/**
 * File `quran/mushafs/{id}`: the layout of a whole mushaf, `pages[p - 1]` is page `p`. Every word of the
 * Quran appears once, in reading order, and every verse ends with its marker.
 */
export const QuranMushafFileSchema = z
    .object({
        schemaVersion: ContentSchemaVersionSchema,
        mushaf: QuranMushafSchema,
        pages: z.array(QuranMushafPageSchema).length(QURAN_MUSHAF_PAGE_COUNT),
    })
    .superRefine((file, ctx) => {
        // Walks the words in reading order: each verse must follow the previous one, its words counting up
        // from 1, and end with its marker.
        let surah = 1;
        let ayah = 1;
        let word = 1;
        let failed = false;
        const fail = (message: string, path: (string | number)[]) => {
            if (!failed) ctx.addIssue({ code: 'custom', message, path });
            failed = true;
        };
        file.pages.forEach((page, pageIndex) => {
            const prefix = `quran/mushafs/${file.mushaf.id}/fonts/${String(pageIndex + 1).padStart(3, '0')}.`;
            if (!page.font.path.startsWith(prefix)) {
                fail(`Page ${pageIndex + 1} font must be under ${prefix}`, ['pages', pageIndex, 'font', 'path']);
            }
            page.lines.forEach((line, lineIndex) => {
                if (line.type !== 'text') return;
                line.words.forEach(([s, a, w], wordIndex) => {
                    const path = ['pages', pageIndex, 'lines', lineIndex, 'words', wordIndex];
                    if (s !== surah || a !== ayah) {
                        fail(`Expected verse ${surah}:${ayah}, got ${s}:${a}`, path);
                    } else if (w === 0) {
                        if (word === 1) fail(`Verse ${s}:${a} has no word before its marker`, path);
                        word = 1;
                        ayah++;
                        if (ayah > QURAN_VERSE_COUNTS[surah - 1]!) {
                            surah++;
                            ayah = 1;
                        }
                    } else if (w !== word) {
                        fail(`Expected word ${word} of ${s}:${a}, got ${w}`, path);
                    } else {
                        word++;
                    }
                });
            });
        });
        if (surah !== QURAN_SURAH_COUNT + 1) fail(`The mushaf stops at verse ${surah}:${ayah}`, ['pages']);
    });
export type QuranMushafFile = z.infer<typeof QuranMushafFileSchema>;

/** Where the font of a page is published, e.g. `quran/mushafs/qpc-v4-tajweed/fonts/003.1a2b3c4d.ttf`. */
export function quranMushafFontPath(mushafId: string, page: number, sha256: string): string {
    return `quran/mushafs/${mushafId}/fonts/${String(page).padStart(3, '0')}.${sha256.slice(0, 8)}.ttf`;
}
