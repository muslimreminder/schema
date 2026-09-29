import { describe, expect, it } from 'vitest';
import {
    contentKeys,
    hashedPath,
    HadithBookFileSchema,
    HadithBooksFileSchema,
    HadithCollectionsFileSchema,
    ManifestSchema,
    QURAN_VERSE_COUNTS,
    quranVerseAudioPath,
    QuranRecitationFileSchema,
    QuranRecitationsFileSchema,
    QuranSurahInfoFileSchema,
    QuranSurahInfosFileSchema,
    QuranTafsirFileSchema,
    QuranTafsirsFileSchema,
    QuranTranslationFileSchema,
    QuranTranslationsFileSchema,
    QuranWordTranslationFileSchema,
    QuranWordTranslationsFileSchema,
} from '../src/content/index.js';
import {
    bookFile,
    booksFile,
    collectionsFile,
    manifest,
    recitationFile,
    surahInfoFile,
    tafsirFile,
    translationFile,
    translationsFile,
    wordTranslationFile,
} from './fixtures.js';

describe('hadith content', () => {
    it('accepts valid files', () => {
        expect(HadithCollectionsFileSchema.parse(collectionsFile)).toEqual(collectionsFile);
        expect(HadithBooksFileSchema.parse(booksFile)).toEqual(booksFile);
        expect(HadithBookFileSchema.parse(bookFile)).toEqual(bookFile);
    });

    it('rejects an unknown schema version', () => {
        expect(HadithCollectionsFileSchema.safeParse({ ...collectionsFile, schemaVersion: 2 }).success).toBe(false);
    });

    it('rejects duplicate collections and books', () => {
        const collections = [...collectionsFile.collections, ...collectionsFile.collections];
        expect(HadithCollectionsFileSchema.safeParse({ ...collectionsFile, collections }).success).toBe(false);
        const books = [...booksFile.books, booksFile.books[0]];
        expect(HadithBooksFileSchema.safeParse({ ...booksFile, books }).success).toBe(false);
    });

    it('rejects a book file whose hadiths do not belong to it', () => {
        const [hadith] = bookFile.hadiths;
        const cases = [
            { ...hadith!, bookId: '2' },
            { ...hadith!, collectionId: 'muslim' },
            { ...hadith!, chapterId: '9.00' },
        ];
        for (const bad of cases) {
            const result = HadithBookFileSchema.safeParse({ ...bookFile, hadiths: [bad] });
            expect(result.success).toBe(false);
        }
        const duplicated = HadithBookFileSchema.safeParse({ ...bookFile, hadiths: [hadith, hadith] });
        expect(duplicated.success).toBe(false);
    });

    it('accepts two hadiths sharing a number (alternative chain) with distinct ids', () => {
        const [hadith] = bookFile.hadiths;
        const alternative = { ...hadith!, id: '100011' };
        expect(HadithBookFileSchema.safeParse({ ...bookFile, hadiths: [hadith, alternative] }).success).toBe(true);
    });

    it('rejects a hadith without any text', () => {
        const hadith = { ...bookFile.hadiths[0]!, texts: {} };
        expect(HadithBookFileSchema.safeParse({ ...bookFile, hadiths: [hadith] }).success).toBe(false);
    });

    it('rejects invalid language codes', () => {
        const collection = { ...collectionsFile.collections[0]!, name: { EN: 'Sahih al-Bukhari' } };
        expect(HadithCollectionsFileSchema.safeParse({ ...collectionsFile, collections: [collection] }).success).toBe(false);
    });
});

describe('manifest', () => {
    it('accepts a valid manifest', () => {
        expect(ManifestSchema.parse(manifest)).toEqual(manifest);
    });

    it('rejects bad hashes and absolute paths', () => {
        const file = manifest.files['hadith/collections']!;
        for (const bad of [{ ...file, sha256: 'abc' }, { ...file, path: '/hadith/collections.json' }]) {
            expect(ManifestSchema.safeParse({ ...manifest, files: { x: bad } }).success).toBe(false);
        }
    });

    it('builds keys and hashed paths', () => {
        expect(contentKeys.hadith.book('bukhari', '1')).toBe('hadith/bukhari/books/1');
        const sha = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
        const path = hashedPath(contentKeys.hadith.collections(), sha);
        expect(path).toBe('hadith/collections.9f86d081.json');
        expect(ManifestSchema.shape.files.valueType.shape.path.safeParse(path).success).toBe(true);
    });
});

describe('quran translations', () => {
    const withVerse = (surah: number, verse: number, value: unknown) => ({
        ...translationFile,
        surahs: translationFile.surahs.map((verses, s) => (s === surah ? verses.map((v, i) => (i === verse ? value : v)) : verses)),
    });

    it('counts the 6,236 verses of the mushaf', () => {
        expect(QURAN_VERSE_COUNTS).toHaveLength(114);
        expect(QURAN_VERSE_COUNTS.reduce((sum, count) => sum + count, 0)).toBe(6236);
    });

    it('accepts valid files', () => {
        expect(QuranTranslationsFileSchema.parse(translationsFile)).toEqual(translationsFile);
        expect(QuranTranslationFileSchema.parse(translationFile)).toEqual(translationFile);
    });

    it('rejects duplicate translations and malformed ids', () => {
        const translations = [...translationsFile.translations, ...translationsFile.translations];
        expect(QuranTranslationsFileSchema.safeParse({ ...translationsFile, translations }).success).toBe(false);
        for (const id of ['hamidullah', 'FR-hamidullah', 'fr_hamidullah', 'fr-']) {
            const translation = { ...translationsFile.translations[0]!, id };
            expect(QuranTranslationsFileSchema.safeParse({ ...translationsFile, translations: [translation] }).success).toBe(false);
        }
    });

    it('rejects a translation with a missing surah or verse', () => {
        expect(QuranTranslationFileSchema.safeParse({ ...translationFile, surahs: translationFile.surahs.slice(1) }).success).toBe(false);
        const surahs = translationFile.surahs.map((verses, s) => (s === 1 ? verses.slice(1) : verses));
        expect(QuranTranslationFileSchema.safeParse({ ...translationFile, surahs }).success).toBe(false);
    });

    it('rejects empty verses and misplaced footnotes', () => {
        expect(QuranTranslationFileSchema.safeParse(withVerse(1, 0, { text: '' })).success).toBe(false);
        const past = { text: 'Alif, Lam, Mim.', footnotes: [{ offset: 99, text: 'Note' }] };
        expect(QuranTranslationFileSchema.safeParse(withVerse(0, 0, past)).success).toBe(false);
        const unordered = { text: 'Alif, Lam, Mim.', footnotes: [{ offset: 5, text: 'B' }, { offset: 2, text: 'A' }] };
        expect(QuranTranslationFileSchema.safeParse(withVerse(0, 0, unordered)).success).toBe(false);
    });

    it('checks the footnoted verse count of the catalog entry', () => {
        const translation = { ...translationFile.translation, footnotedVerseCount: 0 };
        expect(QuranTranslationFileSchema.safeParse({ ...translationFile, translation }).success).toBe(false);
    });

    it('exposes the translation keys', () => {
        expect(contentKeys.quran.translations()).toBe('quran/translations');
        expect(contentKeys.quran.translation('fr-hamidullah')).toBe('quran/translations/fr-hamidullah');
    });
});

describe('quran word-by-word translations', () => {
    it('accepts a valid file and its catalog', () => {
        expect(QuranWordTranslationFileSchema.parse(wordTranslationFile)).toEqual(wordTranslationFile);
        const catalog = { schemaVersion: 1, translations: [wordTranslationFile.translation] };
        expect(QuranWordTranslationsFileSchema.parse(catalog)).toEqual(catalog);
    });

    it('rejects a missing verse, a verse without words, an empty word and a wrong count', () => {
        const surahs = wordTranslationFile.surahs.map((verses, s) => (s === 1 ? verses.slice(1) : verses));
        expect(QuranWordTranslationFileSchema.safeParse({ ...wordTranslationFile, surahs }).success).toBe(false);
        const withVerse = (words: unknown[]) => ({
            ...wordTranslationFile,
            surahs: wordTranslationFile.surahs.map((verses, s) => (s === 0 ? [words, ...verses.slice(1)] : verses)),
        });
        expect(QuranWordTranslationFileSchema.safeParse(withVerse([])).success).toBe(false);
        expect(QuranWordTranslationFileSchema.safeParse(withVerse(['Au nom', ''])).success).toBe(false);
        const translation = { ...wordTranslationFile.translation, translatedWordCount: 4 };
        expect(QuranWordTranslationFileSchema.safeParse({ ...wordTranslationFile, translation }).success).toBe(false);
    });

    it('exposes the word translation keys', () => {
        expect(contentKeys.quran.wordTranslations()).toBe('quran/word-translations');
        expect(contentKeys.quran.wordTranslation('fr-wbw')).toBe('quran/word-translations/fr-wbw');
    });
});

describe('quran surah infos', () => {
    it('accepts a valid file and its catalog', () => {
        expect(QuranSurahInfoFileSchema.parse(surahInfoFile)).toEqual(surahInfoFile);
        const catalog = { schemaVersion: 1, infos: [surahInfoFile.info] };
        expect(QuranSurahInfosFileSchema.parse(catalog)).toEqual(catalog);
        expect(QuranSurahInfosFileSchema.safeParse({ ...catalog, infos: [surahInfoFile.info, surahInfoFile.info] }).success).toBe(false);
    });

    it('rejects a missing surah, an empty introduction, an empty list and a wrong count', () => {
        expect(QuranSurahInfoFileSchema.safeParse({ ...surahInfoFile, surahs: surahInfoFile.surahs.slice(1) }).success).toBe(false);
        const withFirst = (first: unknown) => ({ ...surahInfoFile, surahs: [first, ...surahInfoFile.surahs.slice(1)] });
        expect(QuranSurahInfoFileSchema.safeParse(withFirst({ blocks: [] })).success).toBe(false);
        expect(QuranSurahInfoFileSchema.safeParse(withFirst({ blocks: [{ type: 'list', ordered: false, items: [] }] })).success).toBe(false);
        expect(QuranSurahInfoFileSchema.safeParse(withFirst({ blocks: [{ type: 'quote', text: 'x' }] })).success).toBe(false);
        const info = { ...surahInfoFile.info, surahCount: 2 };
        expect(QuranSurahInfoFileSchema.safeParse({ ...surahInfoFile, info }).success).toBe(false);
    });

    it('exposes the surah info keys', () => {
        expect(contentKeys.quran.surahInfos()).toBe('quran/surah-infos');
        expect(contentKeys.quran.surahInfo('en-maududi')).toBe('quran/surah-infos/en-maududi');
    });
});

describe('quran tafsirs', () => {
    const withPassages = (passages: unknown[]) => ({ ...tafsirFile, surahs: [passages, ...tafsirFile.surahs.slice(1)] });

    it('accepts a valid file and its catalog', () => {
        expect(QuranTafsirFileSchema.parse(tafsirFile)).toEqual(tafsirFile);
        const catalog = { schemaVersion: 1, tafsirs: [tafsirFile.tafsir] };
        expect(QuranTafsirsFileSchema.parse(catalog)).toEqual(catalog);
        expect(QuranTafsirsFileSchema.safeParse({ ...catalog, tafsirs: [tafsirFile.tafsir, tafsirFile.tafsir] }).success).toBe(false);
    });

    it('rejects a missing surah, overlapping or out-of-range passages, an empty passage and a wrong count', () => {
        expect(QuranTafsirFileSchema.safeParse({ ...tafsirFile, surahs: tafsirFile.surahs.slice(1) }).success).toBe(false);
        const [first, second] = tafsirFile.surahs[0]!;
        expect(QuranTafsirFileSchema.safeParse(withPassages([second, first])).success).toBe(false);
        expect(QuranTafsirFileSchema.safeParse(withPassages([first, { ...second, from: 1 }])).success).toBe(false);
        expect(QuranTafsirFileSchema.safeParse(withPassages([first, { ...second, to: 8 }])).success).toBe(false);
        expect(QuranTafsirFileSchema.safeParse(withPassages([first, { ...second, from: 6, to: 5 }])).success).toBe(false);
        expect(QuranTafsirFileSchema.safeParse(withPassages([first, { ...second, blocks: [] }])).success).toBe(false);
        expect(QuranTafsirFileSchema.safeParse(withPassages([first])).success).toBe(false);
    });

    it('exposes the tafsir keys', () => {
        expect(contentKeys.quran.tafsirs()).toBe('quran/tafsirs');
        expect(contentKeys.quran.tafsir('en-ibn-kathir')).toBe('quran/tafsirs/en-ibn-kathir');
    });
});

describe('quran recitations', () => {
    const withFirstVerse = (verse: unknown) => ({
        ...recitationFile,
        surahs: [[verse, ...recitationFile.surahs[0]!.slice(1)], ...recitationFile.surahs.slice(1)],
    });

    it('accepts a valid file and its catalog', () => {
        expect(QuranRecitationFileSchema.parse(recitationFile)).toEqual(recitationFile);
        const catalog = { schemaVersion: 1, recitations: [recitationFile.recitation] };
        expect(QuranRecitationsFileSchema.parse(catalog)).toEqual(catalog);
        const twice = [recitationFile.recitation, recitationFile.recitation];
        expect(QuranRecitationsFileSchema.safeParse({ ...catalog, recitations: twice }).success).toBe(false);
    });

    it('accepts a verse the source did not time word by word', () => {
        expect(QuranRecitationFileSchema.safeParse(withFirstVerse({ words: [] })).success).toBe(false);
        const untimed = { ...recitationFile.recitation, timedVerseCount: 0 };
        const file = { ...withFirstVerse({ words: [] }), recitation: untimed };
        expect(QuranRecitationFileSchema.safeParse(file).success).toBe(true);
    });

    it('rejects a missing surah, unordered, backwards or repeated word timings, and a wrong count', () => {
        expect(QuranRecitationFileSchema.safeParse({ ...recitationFile, surahs: recitationFile.surahs.slice(1) }).success).toBe(false);
        expect(QuranRecitationFileSchema.safeParse(withFirstVerse({ words: [[1, 600, 900], [2, 0, 480]] })).success).toBe(false);
        expect(QuranRecitationFileSchema.safeParse(withFirstVerse({ words: [[1, 600, 400]] })).success).toBe(false);
        expect(QuranRecitationFileSchema.safeParse(withFirstVerse({ words: [[1, 0, 400], [1, 600, 900]] })).success).toBe(false);
        expect(QuranRecitationFileSchema.safeParse(withFirstVerse({ words: [[0, 0, 400]] })).success).toBe(false);
        const recitation = { ...recitationFile.recitation, timedVerseCount: 2 };
        expect(QuranRecitationFileSchema.safeParse({ ...recitationFile, recitation }).success).toBe(false);
    });

    it('rejects a malformed reciter slug and an unknown style', () => {
        const catalog = (recitation: unknown) => QuranRecitationsFileSchema.safeParse({ schemaVersion: 1, recitations: [recitation] });
        expect(catalog({ ...recitationFile.recitation, id: 'Al-Husary' }).success).toBe(false);
        expect(catalog({ ...recitationFile.recitation, id: 'al--husary' }).success).toBe(false);
        expect(catalog({ ...recitationFile.recitation, style: 'tarteel' }).success).toBe(false);
    });

    it('exposes the recitation keys and the audio path of a verse', () => {
        expect(contentKeys.quran.recitations()).toBe('quran/recitations');
        expect(contentKeys.quran.recitation('al-husary')).toBe('quran/recitations/al-husary');
        expect(quranVerseAudioPath('al-husary', 2, 255)).toBe('quran/audio/al-husary/002255.mp3');
        expect(quranVerseAudioPath('sudais', 114, 6)).toBe('quran/audio/sudais/114006.mp3');
    });
});
