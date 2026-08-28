#!/usr/bin/env bash
set -Eeuo pipefail
umask 022
export PATH=/root/.nvm/versions/node/v22.22.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export GIT_TERMINAL_PROMPT=0 NEXT_TELEMETRY_DISABLED=1

[[ ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy\ ([0-9a-f]{40})$ ]] || { echo 'Only deploy <commit SHA> is allowed.' >&2; exit 64; }
sha=${BASH_REMATCH[1]}
exec 9>/var/lock/manora-deploy.lock
flock -w 1800 9
mirror=/var/lib/manora-deploy/frontend.git
releases=/var/www/manora-front-releases
current=/var/www/manora-front-current
original=/var/www/manora-front
export GIT_SSH_COMMAND='ssh -i /root/.ssh/manora-front-readonly -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=/root/.ssh/manora-github-known-hosts'
git --git-dir="$mirror" fetch --no-tags origin +refs/heads/main:refs/heads/main
[[ $(git --git-dir="$mirror" rev-parse refs/heads/main) == "$sha" ]] || { echo 'Skipped: main has advanced; the newer run will deploy.'; exit 0; }
[[ $(df --output=avail -k /var/www | tail -1) -gt 4194304 ]] || { echo 'Need at least 4 GiB free.' >&2; exit 1; }
previous=$(readlink -f "$current")
release="$releases/$(date -u +%Y%m%d%H%M%S)-${sha:0:12}"
mkdir -p "$release"
switched=0
probe_pid=
start_release() {
  local target=$1
  # PM2 startOrReload can retain the old pm_cwd/pm_exec_path for the same name.
  # Replace only this app after the candidate has passed its health check.
  if pm2 describe manora-front >/dev/null 2>&1; then pm2 delete manora-front; fi
  if [[ -f "$target/deploy/ecosystem.config.cjs" ]]; then
    pm2 start "$target/deploy/ecosystem.config.cjs" --only manora-front --env production
  else
    (cd "$target"; pm2 start ecosystem.config.js --cwd "$target" --only manora-front --env production)
  fi
  pm2 jlist | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const a=JSON.parse(s).filter(p=>p.name==="manora-front");const target=process.argv[1];if(a.length!==1||a[0].pm2_env.status!=="online"||a[0].pm2_env.pm_cwd!==target||a[0].pm2_env.pm_exec_path!==target+"/node_modules/next/dist/bin/next"){console.error("PM2 is not running the expected release");process.exitCode=1;}});' "$target"
}
finish() {
  status=$?
  trap - EXIT
  if [[ -n $probe_pid ]]; then kill "$probe_pid" 2>/dev/null || true; wait "$probe_pid" 2>/dev/null || true; fi
  if (( status != 0 )); then
    if (( switched )); then
      ln -s "$previous" "$current.rollback"
      mv -Tf "$current.rollback" "$current"
      start_release "$previous" && pm2 save || echo 'CRITICAL: PM2 rollback failed.' >&2
      echo "Rolled frontend back to $previous" >&2
    fi
    if [[ $(readlink -f "$current") != "$release" ]]; then rm -rf -- "$release"; fi
  fi
  exit "$status"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM HUP
git --git-dir="$mirror" archive "$sha" | tar -x -C "$release"
cd "$release"
# Preserve the existing server configuration; never accept env files from CI.
for name in .env .env.production .env.local .env.production.local; do
  if [[ -f "$original/$name" ]]; then
    # The repository currently tracks .env; replace only the fresh release copy.
    rm -f -- "$name"
    ln -s "$original/$name" "$name"
  fi
done
corepack yarn install --immutable
corepack yarn build
# Build cache is not required by next start and otherwise fills this server.
rm -rf .next/cache/webpack
node node_modules/next/dist/bin/next start -H 127.0.0.1 -p 13002 > /var/log/manora-front-probe.log 2>&1 &
probe_pid=$!
ready=0
for attempt in {1..30}; do
  if curl --fail --silent --max-time 10 http://127.0.0.1:13002/ >/dev/null; then ready=1; break; fi
  sleep 1
done
(( ready )) || { echo 'Candidate frontend health check failed.' >&2; exit 1; }
kill "$probe_pid"; wait "$probe_pid" 2>/dev/null || true; probe_pid=
ln -s "$release" "$current.next"
switched=1
mv -Tf "$current.next" "$current"
start_release "$release"
curl --fail --silent --show-error --retry 10 --retry-all-errors --retry-delay 2 --max-time 15 http://127.0.0.1:3002/ >/dev/null
curl --fail --silent --show-error --retry 5 --retry-all-errors --retry-delay 2 --max-time 15 --resolve manora.tj:443:127.0.0.1 https://manora.tj/ >/dev/null
pm2 save
printf '%s\n' "$sha" > "$release/DEPLOYED_SHA"
printf 'Deployed frontend %s\n' "$sha"
find "$releases" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r | tail -n +4 | while read -r old; do
  [[ "$releases/$old" == "$previous" || "$releases/$old" == "$release" ]] || rm -rf -- "$releases/$old"
done
