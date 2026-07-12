/** @type {import('pm2').StartOptions[]} */
module.exports = {
  apps: [
    {
      name: 'krex-node-mirror',
      script: 'dist/cli.js',
      args: 'mirror',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
