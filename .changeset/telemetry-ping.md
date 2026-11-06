---
'@muslimreminder/schema': minor
---

Add the anonymous statistics contract: `TelemetryPingSchema` (one ping a day at most per install, no identifier: `app`, `audience` flags, flat `settings` and `usage` records) and `telemetryRoutes.ping` (`POST /telemetry`, answered `204`).
