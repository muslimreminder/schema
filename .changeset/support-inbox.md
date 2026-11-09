---
'@muslimreminder/schema': minor
---

Add the support inbox contracts. Tickets may carry `environment.language`, `reporter.inboxKey` and the `settings` of the app. `inboxRoutes.list` (`POST /inbox`) returns the replies to the tickets of a device and the announcements, with `INBOX_PUSH_TAG` and `inboxLink()` for the pushes. The admin's `SupportServiceRpc` (conversations, translation preview, replies, tickets marked as handled, closing an issue like the Telegram buttons, broadcasts aimed at a language and app versions, sent now or scheduled) comes with its input and output schemas.
