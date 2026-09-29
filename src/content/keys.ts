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
        tafsirs: () => 'quran/tafsirs',
        tafsir: (tafsirId: string) => `quran/tafsirs/${tafsirId}`,
        recitations: () => 'quran/recitations',
        recitation: (recitationId: string) => `quran/recitations/${recitationId}`,
    },
} as const;

/** Hashed file path for a key, e.g. `hadith/bukhari/books/1` → `hadith/bukhari/books/1.3f2a9c1b.json`. */
export function hashedPath(key: string, sha256: string): string {
    return `${key}.${sha256.slice(0, 8)}.json`;
}

const padded = (number: number) => String(number).padStart(3, '0');

/**
 * Where the audio of a verse lives under the content root, e.g. `quran/audio/al-husary/002255.mp3`.
 *
 * Audio is the one content the manifest does not list: a recitation is 6,236 files, so the apps
 * compute the path instead of looking it up. The files never change, so they are cached forever like
 * the hashed ones; which verses exist is what `quran/recitations/{id}` says.
 */
export function quranVerseAudioPath(recitationId: string, surah: number, ayah: number): string {
    return `quran/audio/${recitationId}/${padded(surah)}${padded(ayah)}.mp3`;
}
