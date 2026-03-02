# API: Moderation, Publication, Roles

## Roles
- `user`: regular account, can create own listings
- `developer`: can manage own new buildings
- `moderator`: can moderate listings
- `admin`, `superadmin`: full moderation access

## Auth
- `POST /api/register` - register regular user and get token
- `POST /api/login` - login
- `GET /api/user/profile` - current user profile
- `PUT /api/user/profile` - update profile

## Moderation Queue
- `GET /api/moderation/queue?type=all|property|car&status=pending`
- `PATCH /api/moderation/properties/{property}` with body:
  - `status`: `pending|approved|rejected|draft|deleted`
  - `reason`: optional
- `PATCH /api/moderation/cars/{car}` with body:
  - `status`: `pending|approved|rejected|draft|archived`
  - `reason`: optional
- `POST /api/moderation/bulk` with body:
  - `type`: `property|car`
  - `ids`: `number[]`
  - `status`: target moderation status
  - `reason`: optional

## Publication Lifecycle
- All new/edited listings from regular users are forced to `pending`
- Listing becomes public only when:
  - `moderation_status = approved`
  - `is_published = true`
  - `publication_expires_at >= now()`
- Publication period: 14 days
- Owner can republish:
  - `POST /api/properties/{property}/refresh-publication`
  - `POST /api/cars/{car}/refresh-publication`

## Automatic Expiry
- Scheduler runs `php artisan listings:expire` hourly
- Expired listings are automatically unpublished (`is_published = false`)
- System writes moderation history and sends notifications

## Notifications
- Stored in `notifications` table
- Channels:
  - `in_app` always
  - `email` if user has email
  - `sms` if SMS gateway is available

## Moderation History
- Stored in `listing_moderation_logs`
- Tracks:
  - listing type/id
  - old/new status
  - moderator
  - reason
  - timestamp

