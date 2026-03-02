# Support Chat (User <-> Moderator) + WebSocket

## Что реализовано в бэкенде
- Очередь чатов поддержки (`open`, `assigned`, `closed`)
- Авто-распределение новых чатов на модераторов (least-loaded)
- Назначение/переназначение модератором
- Сообщения user/moderator с delivery/read-status
- Realtime-события через Laravel Broadcasting

## Модель сессии
- `chat_sessions.chat_type`: `support|ai`
- `chat_sessions.status`: `open|assigned|closed`
- `assigned_moderator_id`, `assigned_at`, `closed_at`
- `priority`, `topic`, `last_message_at`

## Модель сообщения
- `sender_id`, `recipient_id`
- `role`: `user|moderator|assistant|system|tool`
- `message_type`: `text|system|file`
- `read_at`, `delivered_at`, `seen_at`

## REST API (auth:sanctum)
- `POST /api/support-chat/sessions` — создать чат (`message`, `topic`, `priority`)
- `GET /api/support-chat/sessions` — список сессий
- `GET /api/support-chat/queue` — очередь (только модератор/админ)
- `GET /api/support-chat/sessions/{session_uuid}` — карточка чата
- `GET /api/support-chat/sessions/{session_uuid}/messages?limit=50&before_id=...`
- `POST /api/support-chat/sessions/{session_uuid}/messages` — отправить сообщение (`content`)
- `POST /api/support-chat/sessions/{session_uuid}/assign` — назначить модератора
- `POST /api/support-chat/sessions/{session_uuid}/close` — закрыть чат
- `POST /api/support-chat/sessions/{session_uuid}/read` — пометить входящие как прочитанные
- `POST /api/support-chat/sessions/{session_uuid}/delivered` — пометить доставку
- `POST /api/support-chat/sessions/{session_uuid}/seen` — пометить просмотр

## Direct Chat (user <-> user)
- `GET /api/direct-chat/sessions`
- `POST /api/direct-chat/sessions` body: `{ "user_id": 123 }`
- `GET /api/direct-chat/sessions/{session_uuid}/messages`
- `POST /api/direct-chat/sessions/{session_uuid}/messages` body: `{ "content": "..." }`
- `POST /api/direct-chat/sessions/{session_uuid}/read`
- `POST /api/direct-chat/sessions/{session_uuid}/delivered` body: `{ "message_ids": [1,2] }`
- `POST /api/direct-chat/sessions/{session_uuid}/seen` body: `{ "message_ids": [1,2] }`

## WebSocket каналы
- `private-support.session.{session_uuid}`
- `private-support.moderators`
- `private-direct.session.{session_uuid}`

## Broadcast события
- `support.message.sent`
- `support.session.updated`
- `direct.message.sent`
- `direct.session.updated`
- `chat.message.status.updated`

## Галочки (как в мессенджерах)
- `delivery_status = sent` -> одна галочка
- `delivery_status = delivered` -> две серые галочки
- `delivery_status = seen` -> две синие галочки

## Рекомендация для Laravel
- Лучший вариант: **Laravel Reverb** (нативно для Laravel 11/12)
- Альтернатива: Pusher (SaaS)

## Минимальная настройка Reverb (сервер)
1. Установить Reverb:
```bash
composer require laravel/reverb
php artisan reverb:install
```
2. В `.env`:
```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=app-id
REVERB_APP_KEY=app-key
REVERB_APP_SECRET=app-secret
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http
```
3. Запуск:
```bash
php artisan reverb:start
```

## Минимальная настройка фронта (Laravel Echo)
```js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: Number(import.meta.env.VITE_REVERB_PORT),
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
  authEndpoint: '/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
});

echo.private(`support.session.${sessionUuid}`)
  .listen('.support.message.sent', (e) => {
    // append message
  })
  .listen('.support.session.updated', (e) => {
    // update session badge/status
  });

echo.private('support.moderators')
  .listen('.support.session.updated', (e) => {
    // refresh queue widgets
  });
```

## Важные моменты для фронта
- После отправки сообщения делайте optimistic UI + подтверждение по websocket
- На reconnect делайте `GET /messages` для синхронизации
- Для unread используйте `read_at == null`
- Для модераторского интерфейса:
  - вкладка `waiting`: `status=open`
  - вкладка `my`: `assigned_moderator_id=currentUser`
