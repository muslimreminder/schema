# @muslimreminder/schema

## 0.6.0

### Minor Changes

- [`c3aa4df`](https://github.com/muslimreminder/schema/commit/c3aa4dfac8815f626a5569469855c239e3975bbb) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - Add Quran tafsirs: `quran/tafsirs` catalog (several per language, optional `author`, `verseCount`) and `quran/tafsirs/{id}` files (`surahs[s-1]` = ordered passages `{ from, to, blocks }` covering one or several verses; plain-text blocks `heading` / `paragraph` / `list` / `quote`), `contentKeys.quran.tafsirs` / `tafsir`.

## 0.5.0

### Minor Changes

- [#8](https://github.com/muslimreminder/schema/pull/8) [`a8e5f54`](https://github.com/muslimreminder/schema/commit/a8e5f5465c0bb3813225912f3ae8ba80747323ba) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - Add Quran surah introductions: `quran/surah-infos` catalog and `quran/surah-infos/{id}` files (`surahs[s-1]`, `null` when the source has none; plain-text blocks `heading` / `paragraph` / `list` and an optional `summary`), `contentKeys.quran.surahInfos` / `surahInfo`.

## 0.4.0

### Minor Changes

- [`1fc4301`](https://github.com/muslimreminder/schema/commit/1fc43013bd4a730d60977a38012910fe3783dfb1) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - Add Quran word-by-word translations: `quran/word-translations` catalog and `quran/word-translations/{id}` files (`surahs[s-1][v-1][w-1]`, `null` for an untranslated word), `contentKeys.quran.wordTranslations` / `wordTranslation`.

## 0.3.0

### Minor Changes

- [#5](https://github.com/muslimreminder/schema/pull/5) [`f3674fb`](https://github.com/muslimreminder/schema/commit/f3674fb12c50a66359294237473f190919be1a11) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - Add Quran verse-by-verse translations: `quran/translations` catalog, `quran/translations/{id}` files (plain text, footnotes kept with their offset), `QURAN_VERSE_COUNTS` and `contentKeys.quran`.

## 0.2.0

### Minor Changes

- [#3](https://github.com/muslimreminder/schema/pull/3) [`63aec61`](https://github.com/muslimreminder/schema/commit/63aec61f7e61aea814f1ad84fd9ddd0b220b118b) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - **Breaking (content):** `Hadith` gets a required `id`, unique in its collection (sunnah.com Arabic URN). `number` is no longer required to be unique in a book file: a hadith and its alternative chain can share the same number. Use `id` for favorites and links.

## 0.1.0

### Minor Changes

- [`b4cd73f`](https://github.com/muslimreminder/schema/commit/b4cd73f5470de5753fa9ce280e761d7031cb0c34) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - First release: `common` (languages, localized text, attribution), `content` (hadith collections/books/hadiths, manifest, content keys) and `api` (report bug and contact us contracts of the ticket worker).
