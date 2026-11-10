---
'@muslimreminder/schema': minor
---

A ticket no longer creates a GitHub issue. Tickets carry their `resolution` (`done`, `wont_do`, `ignored`), and `SupportServiceRpc` gains `resolveTicket`, `createIssue` and `linkIssue`. `TicketSummarySchema` also gives `resolution` and `issueNumber`. The `url` of `TicketCreatedResponseSchema` is optional and deprecated, next to a new `id`. `closeIssue` and `markHandled` are deprecated.
