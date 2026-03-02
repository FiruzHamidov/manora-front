# CI/CD

## Что делает workflow

- На `pull_request` в `main` запускает `eslint` и `next build`.
- На `push` в `main` после успешного CI подключается к серверу по `SSH`.
- На сервере подтягивает свежий код, обновляет `.env.production`, ставит зависимости, собирает проект и перезапускает `PM2`.

## GitHub Secrets

Добавьте следующие secrets в репозитории:

- `SSH_HOST` - IP или домен сервера.
- `SSH_PORT` - SSH порт. Если не задан, используется `22`.
- `SSH_USER` - пользователь на сервере.
- `SSH_PRIVATE_KEY` - приватный ключ для входа по SSH.
- `SSH_KNOWN_HOSTS` - вывод `ssh-keyscan -H your-host`.
- `DEPLOY_PATH` - путь до проекта на сервере, например `/var/www/manora-front`.
- `DEPLOY_BRANCH` - ветка для деплоя. Если не задан, используется `main`.
- `PM2_APP_NAME` - имя приложения в `PM2`. Если не задан, используется `aura-front`.
- `APP_ENV_PRODUCTION` - содержимое production env файла.

## Что должно быть на сервере

- Репозиторий уже склонирован в `DEPLOY_PATH`.
- У сервера есть доступ к origin-репозиторию.
- Установлены `git`, `Node.js 20+`, `corepack`, `yarn` и `pm2`.
- Для `pm2` используется существующий [`ecosystem.config.js`](/Users/sarvat/Documents/GitHub/manora-front/ecosystem.config.js).

Если Node установлен через `nvm`, workflow сам переключится на `Node 20`.

## Пример APP_ENV_PRODUCTION

```env
NEXT_PUBLIC_APP_URL=https://aura.tj
NEXT_PUBLIC_API_URL=https://back.manora.tj/api
NEXT_PUBLIC_STORAGE_URL=https://back.manora.tj/storage
NEXT_PUBLIC_COOKIE_DOMAIN=.manora.tj
NEXT_PUBLIC_COOKIE_SECURE=true
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=...
TG_BOT_TOKEN=...
TG_CHAT_ID=...
TG_THREAD_ID=...
```
