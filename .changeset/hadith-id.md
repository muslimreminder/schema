---
"@muslimreminder/schema": minor
---

**Breaking (content):** `Hadith` gets a required `id`, unique in its collection (sunnah.com Arabic URN). `number` is no longer required to be unique in a book file: a hadith and its alternative chain can share the same number. Use `id` for favorites and links.
