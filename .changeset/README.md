# Changesets

Every PR that changes the published package adds a changeset: `npm run changeset`.

- `patch`: fix, doc, stricter message — no consumer change.
- `minor`: new schema, new optional field, new export.
- `major`: removed/renamed field, field made required, stricter validation that can reject existing data.
