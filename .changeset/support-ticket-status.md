---
'@muslimreminder/schema': minor
---

The admin handles support tickets one by one. Tickets carry their `status` (`awaiting`, `replied`, `handled`) and who marked them as `handled`. `SupportServiceRpc` gains `listTickets` (with `TicketSummarySchema` and `TicketPageSchema`) and `reopenTicket`, and `markHandled` only marks the given ticket. `listConversations` and `reopenConversation` are deprecated.
