# @muslimreminder/schema

## 0.13.0

### Minor Changes

- [#20](https://github.com/muslimreminder/schema/pull/20) [`070c98b`](https://github.com/muslimreminder/schema/commit/070c98ba8cd447c33044e0abd8fee743deae5e56) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - A ticket no longer creates a GitHub issue. Tickets carry their `resolution` (`done`, `wont_do`, `ignored`), and `SupportServiceRpc` gains `resolveTicket`, `createIssue` and `linkIssue`. `TicketSummarySchema` also gives `resolution` and `issueNumber`. The `url` of `TicketCreatedResponseSchema` is optional and deprecated, next to a new `id`. `closeIssue` and `markHandled` are deprecated.

## 0.12.0

### Minor Changes

- [#18](https://github.com/muslimreminder/schema/pull/18) [`e6ac8df`](https://github.com/muslimreminder/schema/commit/e6ac8dff8f61d5782cc6b9b8f2f6e603435d94ca) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - The admin handles support tickets one by one. Tickets carry their `status` (`awaiting`, `replied`, `handled`) and who marked them as `handled`. `SupportServiceRpc` gains `listTickets` (with `TicketSummarySchema` and `TicketPageSchema`) and `reopenTicket`, and `markHandled` only marks the given ticket. `listConversations` and `reopenConversation` are deprecated.

## 0.11.0

### Minor Changes

- [#16](https://github.com/muslimreminder/schema/pull/16) [`3d7fa12`](https://github.com/muslimreminder/schema/commit/3d7fa12c0ddd0d29292ebd42b71b208c7e26070f) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - Add the support inbox contracts. Tickets may carry `environment.language`, `reporter.inboxKey` and the `settings` of the app. `inboxRoutes.list` (`POST /inbox`) returns the replies to the tickets of a device and the announcements, with `INBOX_PUSH_TAG` and `inboxLink()` for the pushes. The admin's `SupportServiceRpc` (conversations, translation preview, replies, tickets marked as handled, closing an issue like the Telegram buttons, broadcasts aimed at a language and app versions, sent now or scheduled) comes with its input and output schemas.

## 0.10.0

### Minor Changes

- [#14](https://github.com/muslimreminder/schema/pull/14) [`6b86982`](https://github.com/muslimreminder/schema/commit/6b86982b8468f3c4030201f4cf8fffb7e8d78558) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - Add the anonymous statistics contract: `TelemetryPingSchema` (one ping a day at most per install, no identifier: `app`, `audience` flags, flat `settings` and `usage` records) and `telemetryRoutes.ping` (`POST /telemetry`, answered `204`).

## 0.9.0

### Minor Changes

- [#13](https://github.com/muslimreminder/schema/pull/13) [`89b3508`](https://github.com/muslimreminder/schema/commit/89b3508c260e128094e3196f2864edf736ce539b) Thanks [@iambluedev1](https://github.com/iambluedev1)! - Add an optional `email` to `ReportBugSchema`, so the reporter of a bug can be contacted back, and document the `Reporter` ids: `userId` identifies the device, `sessionId` the app launch.

## 0.8.0

### Minor Changes

- Add downloadable mushafs: the `quran/mushafs` catalog and the `quran/mushafs/{id}` layout, whose page fonts are published at `quranMushafFontPath(id, page, sha256)`.

## 0.7.0

### Minor Changes

- Add Quran recitations: `quran/recitations` catalog (reciter, `murattal` / `mujawwad` style, `timedVerseCount`) and `quran/recitations/{id}` files (`surahs[s-1][v-1]` = the audio of verse `s:v`, its `duration` and its `words`, each `[word, start, end]` in milliseconds), `contentKeys.quran.recitations` / `recitation`, and `quranVerseAudioPath(id, surah, ayah)` for the verse audio files, which the manifest does not list.

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
