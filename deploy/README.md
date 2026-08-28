# Manora frontend deployment

Push to `main` runs ESLint, Node tests, and a Next.js build, then deploys that
exact commit. Pull requests run CI only. A manual Actions run on `main` also
deploys. Failed CI prevents deployment; active deployment runs are not cancelled
by a newer push.

## Server layout

- Original checkout and production environment files: `/var/www/manora-front`
- Code releases: `/var/www/manora-front-releases/<timestamp>-<sha>`
- Current release: `/var/www/manora-front-current`
- Restricted SSH entrypoint: `/usr/local/lib/manora-deploy/frontend.sh`
- Read-only Git mirror: `/var/lib/manora-deploy/frontend.git`
- Runtime: Node 22.22.0, Yarn 4.12.0, PM2 app `manora-front`, port 3002
- Public URL: <https://manora.tj>

Existing `.env`, `.env.production`, and optional local environment files are
symlinked from the original checkout. Never overwrite them with empty CI values.
Only `.env.example` is tracked. Earlier commits contained a Telegram bot token;
rotate it with the provider because removing files does not erase Git history.
Changes to `NEXT_PUBLIC_*` settings require a new build. Do not deploy with
`git pull` in the original checkout; use Actions.

The new release installs locked dependencies, builds separately, and starts a
temporary candidate bound to `127.0.0.1:13002`. Only after it responds successfully
does PM2 replace only `manora-front` on `127.0.0.1:3002`. The script verifies the
actual PM2 working directory and executable path before accepting deployment.
The single PM2 process means a
short restart interruption is possible. Both local and HTTPS health checks run;
on failure the previous release is restored. Three successful releases are kept.
Build-only Webpack cache is removed to limit disk usage. At least 4 GiB free is
required before building. The original checkout is never automatically deleted.

The dedicated `manora-front-startup.service` restores only this PM2 application
after a reboot. It does not restart or reconfigure Aura. Both Manora deployments
use a shared server lock to avoid simultaneous production builds.

## Access and maintenance

Actions secrets: `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`,
`SSH_KNOWN_HOSTS`. The key permits only the root-owned forced command
`deploy <40-character lowercase SHA>`, with SSH forwarding and PTY disabled.
Only the latest `main` SHA may deploy; older queued jobs skip. A separate
read-only Git deploy key lets the server fetch this repository. The legacy
`APP_ENV_PRODUCTION`, `DEPLOY_PATH`, `DEPLOY_BRANCH`, and `PM2_APP_NAME` secrets
are no longer consumed by the workflow.

The existing application runtime belongs to root. Although the CI key cannot
open a shell, merged application code executes during build/start, so only
trusted maintainers should merge to `main`.

Operator credentials and generated keys are stored outside Git in
`~/.config/manora/deploy/` (directory 0700, credentials/key files 0600).
No server password or personal GitHub token belongs in this repository.

For manual rollback, use operator SSH access, point the current symlink to a
retained release, run `pm2 delete manora-front`, then run
`pm2 start <release>/deploy/ecosystem.config.cjs --only manora-front --env production`
with Node 22.22.0 on PATH. Do not use `startOrReload` to change release paths:
PM2 can retain the old working directory and executable.
Check port 3002 and the public URL, then `pm2 save`. The original checkout uses
its root-level `ecosystem.config.js`; run from its directory with `--cwd` set.

Changes to `server-deploy.sh` require operator installation into
`/usr/local/lib/manora-deploy/frontend.sh` (root:root, 0755). Service changes
require installation under `/etc/systemd/system/` and `systemctl daemon-reload`.
The PM2 config is included in each release and updates automatically.
