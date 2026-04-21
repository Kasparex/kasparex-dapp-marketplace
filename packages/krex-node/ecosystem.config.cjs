/** @type {import('pm2').StartOptions[]} */
module.exports = {
  apps: [
    {
      name: 'krex-node',
      script: 'dist/cli.js',
      args: 'heartbeat',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
