// eslint-disable-next-line @typescript-eslint/no-require-imports -- PM2 loads this config through CommonJS.
const path = require('node:path');
const cwd = path.resolve(__dirname, '..');

module.exports = {
  apps: [{
    name: 'manora-front',
    cwd,
    script: path.join(cwd, 'node_modules/next/dist/bin/next'),
    args: 'start -H 127.0.0.1 -p 3002',
    exec_mode: 'fork',
    instances: 1,
    watch: false,
    env: { NODE_ENV: 'production', PORT: 3002 },
    env_production: { NODE_ENV: 'production', PORT: 3002 },
  }],
};
