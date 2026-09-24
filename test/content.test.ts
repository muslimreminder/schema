import { describe, expect, it } from 'vitest';
import {
    contentKeys,
    hashedPath,
    HadithBookFileSchema,
    HadithBooksFileSchema,
    HadithCollectionsFileSchema,
    ManifestSchema,
} from '../src/content/index.js';
import { bookFile, booksFile, collectionsFile, manifest } from './fixtures.js';

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
