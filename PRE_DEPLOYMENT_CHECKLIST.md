# Pre-Deployment Checklist

Before pushing to production:

1. Run `npm install` if dependencies changed.
2. Run `npm run lint` and `npm run build` locally when you change app code.
3. For contract changes, run `npm run hardhat:compile`.
4. Set required `NEXT_PUBLIC_*` and Worker secrets for the networks you use (see `SETUP_ENV_GUIDE.md` for `.env` basics).

After pushing, apply Vercel env vars and deploy Workers / D1 migrations as needed for your stack.
