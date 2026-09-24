# @muslimreminder/schema

Shared [Zod](https://zod.dev) schemas and TypeScript types for Muslim Reminder.
One source of truth for the content published on the CDN and for the API contracts,
used by the mobile app, the landing, the ticket worker and the data ETL.

```sh
npm install @muslimreminder/schema zod
```

ESM only, no runtime dependency besides the `zod` (v4) peer, no Node API: works in
React Native (Expo), browsers, Cloudflare Workers and Node ≥ 20.19.

## Entry points

| Import | Content |
| --- | --- |
| `@muslimreminder/schema/common` | `LanguageCode`, `LocalizedText`, `Attribution` |
| `@muslimreminder/schema/content` | Published content: hadith files, `Manifest`, `contentKeys`, `CONTENT_SCHEMA_VERSION` |
| `@muslimreminder/schema/api` | Ticket worker contracts: `ReportBugRequest`, `ContactUsRequest`, `ticketRoutes` |
| `@muslimreminder/schema` | Everything above |

## Content on the CDN

```
https://cdn.muslim-reminder.com/v1/manifest.json                  short cache
https://cdn.muslim-reminder.com/v1/hadith/collections.<hash>.json immutable
https://cdn.muslim-reminder.com/v1/hadith/<collection>/books.<hash>.json
https://cdn.muslim-reminder.com/v1/hadith/<collection>/books/<book>.<hash>.json
```

The manifest maps stable keys (`contentKeys.hadith.book('bukhari', '1')`) to the current
hashed file. Clients download the manifest, compare hashes with their local copy and fetch
only what changed.

```ts
import { contentKeys, HadithBookFileSchema, ManifestSchema } from '@muslimreminder/schema/content';

const base = 'https://cdn.muslim-reminder.com/v1';
const manifest = ManifestSchema.parse(await (await fetch(`${base}/manifest.json`)).json());
const entry = manifest.files[contentKeys.hadith.book('bukhari', '1')];
const book = HadithBookFileSchema.parse(await (await fetch(`${base}/${entry.path}`)).json());
```

Texts are plain text (no HTML), keyed by language (`texts.en`, `texts.ar`…). Identifiers
(`bookId`, hadith `number`, `chapterId`) are strings.

## API contracts

```ts
import { ticketRoutes, type ReportBugRequest } from '@muslimreminder/schema/api';

// Worker
const result = ticketRoutes.reportBug.request.safeParse(await c.req.json());
if (!result.success) return c.json({ error: result.error.issues[0].message }, 400);

// Client
const body: ReportBugRequest = { bug: { title, environment, reporter: {}, createdAt: new Date().toISOString() } };
```

`createdAt` must be ISO 8601; optional fields (`email`, `description`) are omitted, not filled
with placeholders.

## Development

```sh
npm install
npm run check      # typecheck, tests, build, publint + attw
npm run changeset  # describe your change (required for anything published)
```

Local testing in a consumer: `npx yalc publish` here, `npx yalc add @muslimreminder/schema` there.

Releases: merging to `main` opens a "Version Packages" PR; merging it publishes to npm
(with provenance). See [.changeset/README.md](.changeset/README.md) for semver rules.
