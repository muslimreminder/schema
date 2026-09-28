import { QURAN_VERSE_COUNTS } from '../src/content/index.js';
import type {
    HadithBookFile,
    HadithBooksFile,
    HadithCollectionsFile,
    Manifest,
    QuranTranslationFile,
    QuranTranslationsFile,
    QuranWordTranslationFile,
} from '../src/index.js';

const retrievedAt = '2026-09-24T10:00:00.000Z';

export const collectionsFile: HadithCollectionsFile = {
    schemaVersion: 1,
    collections: [
        {
            id: 'bukhari',
            name: { en: 'Sahih al-Bukhari', ar: 'صحيح البخاري' },
            bookCount: 97,
            hadithCount: 7277,
            languages: ['ar', 'en'],
            attribution: { source: 'sunnah.com', sourceUrl: 'https://sunnah.com', retrievedAt },
        },
    ],
};

export const booksFile: HadithBooksFile = {
    schemaVersion: 1,
    collectionId: 'bukhari',
    books: [
        { id: '1', order: 1, name: { en: 'Revelation', ar: 'كتاب بدء الوحى' }, hadithCount: 7, numberRange: { first: 1, last: 7 } },
        { id: 'introduction', order: 2, name: { en: 'Introduction' }, hadithCount: 0 },
    ],
};

export const bookFile: HadithBookFile = {
    schemaVersion: 1,
    collectionId: 'bukhari',
    book: { id: '1', order: 1, name: { en: 'Revelation', ar: 'كتاب بدء الوحى' }, hadithCount: 1 },
    chapters: [
        {
            id: '1.00',
            title: {
                en: "How the Divine Revelation started being revealed to Allah's Messenger",
                ar: 'باب كَيْفَ كَانَ بَدْءُ الْوَحْىِ إِلَى رَسُولِ اللَّهِ صلى الله عليه وسلم',
            },
        },
    ],
    hadiths: [
        {
            id: '100010',
            collectionId: 'bukhari',
            bookId: '1',
            number: '1',
            chapterId: '1.00',
            texts: {
                en: {
                    narrator: "Narrated 'Umar bin Al-Khattab:",
                    body: 'I heard Allah\'s Messenger (ﷺ) saying, "The reward of deeds depends upon the intentions..."',
                    grades: [],
                },
                ar: {
                    body: 'حَدَّثَنَا الْحُمَيْدِيُّ ... إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
                    segments: [
                        { type: 'sanad', text: 'حَدَّثَنَا الْحُمَيْدِيُّ ...' },
                        { type: 'matan', text: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ' },
                    ],
                    grades: [{ grade: 'صحيح', gradedBy: null }],
                },
            },
        },
    ],
};

export const manifest: Manifest = {
    schemaVersion: 1,
    generatedAt: retrievedAt,
    files: {
        'hadith/collections': {
            path: 'hadith/collections.9f86d081.json',
            sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
            bytes: 1234,
        },
    },
};

export const translationsFile: QuranTranslationsFile = {
    schemaVersion: 1,
    translations: [
        {
            id: 'fr-hamidullah',
            language: 'fr',
            name: 'Muhammad Hamidullah',
            footnotedVerseCount: 1,
            attribution: { source: 'Quranic Universal Library', sourceUrl: 'https://qul.tarteel.ai/resources/translation/227', retrievedAt },
        },
    ],
};

export const translationFile: QuranTranslationFile = {
    schemaVersion: 1,
    translation: translationsFile.translations[0]!,
    surahs: QURAN_VERSE_COUNTS.map((count, surah) =>
        Array.from({ length: count }, (_, verse) => ({ text: `Verset ${surah + 1}:${verse + 1}` })),
    ),
};
translationFile.surahs[0]![0] = {
    text: 'Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux.',
    footnotes: [{ offset: 63, text: 'C’est la formule que prononce le Musulman au commencement de tout acte.' }],
};

export const wordTranslationFile: QuranWordTranslationFile = {
    schemaVersion: 1,
    translation: {
        id: 'fr-wbw',
        language: 'fr',
        name: 'Mot à mot (français)',
        translatedWordCount: 0,
        attribution: { source: 'Quranic Universal Library', retrievedAt },
    },
    surahs: QURAN_VERSE_COUNTS.map((count) => Array.from({ length: count }, () => [null])),
};
wordTranslationFile.surahs[0]![0] = ['Au nom', 'd’Allah', null, 'le Très Miséricordieux'];
wordTranslationFile.translation.translatedWordCount = 3;
