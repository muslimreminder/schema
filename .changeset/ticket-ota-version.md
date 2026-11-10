---
'@muslimreminder/schema': minor
---

Tickets may carry the over-the-air update the app runs: `environment.bundleVersion` (the version of the JavaScript, higher than `appVersion` once an update is applied) and `environment.updateId` (`null` on the bundle shipped in the binary). `SupportTicketSchema` gives both, `null` for the tickets that do not have them.
