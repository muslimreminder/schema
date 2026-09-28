/**
 * Logical keys of the manifest, shared by the ETL (writer) and the apps (readers).
 * A key is stable; the file it points to changes whenever its content changes.
 */
export const contentKeys = {
    hadith: {
        collections: () => 'hadith/collections',
        books: (collectionId: string) => `hadith/${collectionId}/books`,
        book: (collectionId: string, bookId: string) => `hadith/${collectionId}/books/${bookId}`,
    },
    quran: {
        translations: () => 'quran/translations',
        translation: (translationId: string) => `quran/translations/${translationId}`,
        wordTranslations: () => 'quran/word-translations',
        wordTranslation: (translationId: string) => `quran/word-translations/${translationId}`,
        surahInfos: () => 'quran/surah-infos',
        surahInfo: (infoId: string) => `quran/surah-infos/${infoId}`,
    },
} as const;

/** Hashed file path for a key, e.g. `hadith/bukhari/books/1` → `hadith/bukhari/books/1.3f2a9c1b.json`. */
export function hashedPath(key: string, sha256: string): string {
    return `${key}.${sha256.slice(0, 8)}.json`;
}
