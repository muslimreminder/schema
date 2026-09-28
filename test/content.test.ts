import { describe, expect, it } from 'vitest';
import {
    contentKeys,
    hashedPath,
    HadithBookFileSchema,
    HadithBooksFileSchema,
    HadithCollectionsFileSchema,
    ManifestSchema,
    QURAN_VERSE_COUNTS,
    QuranTranslationFileSchema,
    QuranTranslationsFileSchema,
} from '../src/content/index.js';
import { bookFile, booksFile, collectionsFile, manifest, translationFile, translationsFile } from './fixtures.js';

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
