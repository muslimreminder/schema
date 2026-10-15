import { QURAN_VERSE_COUNTS } from '../src/content/index.js';
import type {
    HadithBookFile,
    HadithBooksFile,
    HadithCollectionsFile,
    Manifest,
    QuranMushafFile,
    QuranMushafWord,
    QuranRecitationFile,
    QuranTranslationFile,
    QuranTranslationsFile,
    QuranSurahInfoFile,
    QuranTafsirFile,
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

export const surahInfoFile: QuranSurahInfoFile = {
    schemaVersion: 1,
    info: {
        id: 'en-maududi',
        language: 'en',
        name: 'Abul Ala Maududi',
        surahCount: 1,
        attribution: { source: 'Quranic Universal Library', sourceUrl: 'https://qul.tarteel.ai/resources/surah-info/3', retrievedAt },
    },
    surahs: Array.from({ length: 114 }, () => null),
};
surahInfoFile.surahs[0] = {
    summary: 'This Surah is named Al-Fatihah because of its subject matter.',
    blocks: [
        { type: 'heading', text: 'Name' },
        { type: 'paragraph', text: 'This Surah is named Al-Fatihah because of its subject matter.' },
        { type: 'list', ordered: true, items: ['Praise', 'Prayer'] },
    ],
};

export const tafsirFile: QuranTafsirFile = {
    schemaVersion: 1,
    tafsir: {
        id: 'en-ibn-kathir',
        language: 'en',
        name: 'Tafsir Ibn Kathir',
        author: 'Ismail ibn Kathir',
        verseCount: 4,
        attribution: { source: 'Quranic Universal Library', sourceUrl: 'https://qul.tarteel.ai/resources/tafsir/35', retrievedAt },
    },
    surahs: Array.from({ length: 114 }, () => []),
};
tafsirFile.surahs[0] = [
    { from: 1, to: 1, blocks: [{ type: 'heading', text: 'The Meaning of Al-Fatihah' }, { type: 'paragraph', text: 'This Surah is called Al-Fatihah.' }] },
    {
        from: 5,
        to: 7,
        blocks: [
            { type: 'quote', text: 'You (alone) we worship, and You (alone) we ask for help.' },
            { type: 'list', ordered: false, items: ['Worship', 'Help'] },
        ],
    },
];

export const recitationFile: QuranRecitationFile = {
    schemaVersion: 1,
    recitation: {
        id: 'al-husary',
        reciter: 'Mahmoud Khalil Al-Husary',
        style: 'murattal',
        timedVerseCount: 1,
        attribution: { source: 'Quranic Universal Library', sourceUrl: 'https://qul.tarteel.ai/resources/recitation/957', retrievedAt },
    },
    surahs: QURAN_VERSE_COUNTS.map((count) => Array.from({ length: count }, () => ({ words: [] }))),
};
recitationFile.surahs[0]![0] = {
    duration: 5400,
    words: [
        [1, 0, 480],
        [2, 600, 1000],
        [3, 1800, 2160],
        [4, 2480, 5160],
    ],
};

/** A mushaf of one word per verse, spread over the 604 pages, with the header and basmala of Al-Baqarah on page 2. */
export const mushafFile: QuranMushafFile = (() => {
    const verses = QURAN_VERSE_COUNTS.flatMap((count, surah) => Array.from({ length: count }, (_, ayah) => [surah + 1, ayah + 1] as const));
    const perPage = Math.ceil(verses.length / 604);
    const pages: QuranMushafFile['pages'] = Array.from({ length: 604 }, (_, index) => {
        const words: QuranMushafWord[] = verses
            .slice(index * perPage, (index + 1) * perPage)
            .flatMap(([surah, ayah]) => [[surah, ayah, 1, '\uFC41'], [surah, ayah, 0, '\uFC42']] satisfies QuranMushafWord[]);
        const page = String(index + 1).padStart(3, '0');
        return {
            font: { path: `quran/mushafs/qpc-v4-tajweed/fonts/${page}.0123abcd.ttf`, sha256: 'a'.repeat(64), bytes: 1000 },
            lines: words.length ? [{ type: 'text', centered: false, words }] : [{ type: 'basmala' }],
        };
    });
    pages[1]!.lines.unshift({ type: 'surah-name', surah: 2 }, { type: 'basmala' });
    return {
        schemaVersion: 1,
        mushaf: {
            id: 'qpc-v4-tajweed',
            name: 'KFGQPC V4 Tajweed (1441H)',
            tajweed: true,
            lineCount: 15,
            bytes: 604_000,
            attribution: { source: 'Quranic Universal Library', sourceUrl: 'https://qul.tarteel.ai/resources/font/240', retrievedAt },
        },
        pages,
    };
})();
