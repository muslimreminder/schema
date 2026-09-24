# @muslimreminder/schema

## 0.2.0

### Minor Changes

- [#3](https://github.com/muslimreminder/schema/pull/3) [`63aec61`](https://github.com/muslimreminder/schema/commit/63aec61f7e61aea814f1ad84fd9ddd0b220b118b) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - **Breaking (content):** `Hadith` gets a required `id`, unique in its collection (sunnah.com Arabic URN). `number` is no longer required to be unique in a book file: a hadith and its alternative chain can share the same number. Use `id` for favorites and links.

## 0.1.0

### Minor Changes

- [`b4cd73f`](https://github.com/muslimreminder/schema/commit/b4cd73f5470de5753fa9ce280e761d7031cb0c34) Thanks [@BanelhaqB](https://github.com/BanelhaqB)! - First release: `common` (languages, localized text, attribution), `content` (hadith collections/books/hadiths, manifest, content keys) and `api` (report bug and contact us contracts of the ticket worker).
