# Private journal data policy

## Scope

Journal entries are private reflections owned by one authenticated user. The
feature does not support public posting, shared links, feeds, or discovery.

## API contract

The API exposes owner-scoped CRUD under `/api/v1/journal`:

- `POST /api/v1/journal`
- `GET /api/v1/journal`
- `GET /api/v1/journal/{id}`
- `PUT /api/v1/journal/{id}?version={version}`
- `DELETE /api/v1/journal/{id}`

Every repository query includes `user_id`. A different authenticated user
receives `404` for entries they do not own.

## Privacy and injection rules

- Entries are persisted with `visibility = PRIVATE`.
- The schema prevents any visibility value except `PRIVATE`.
- Journal title and content are normalized before storage.
- HTML-significant characters are escaped before persistence to neutralize
  stored script injection if a future UI accidentally renders journal content as
  HTML.
- Feature code does not log journal title or content.

## Deletion

Deletion removes the journal row for the authenticated owner. Because the row is
owned through `user_id`, account deletion also cascades journal removal.
