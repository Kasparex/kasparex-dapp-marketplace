#!/bin/sh
# Exit 0 = skip Vercel build. Exit 1 = build.
# Keeps attestation/tip/receipt data commits from burning the deploy queue.
msg="$(git log -1 --pretty=%B 2>/dev/null || true)"
case "$msg" in
  *'[skip vercel]'*|*'chore(bridge): upsert'*)
    echo "vercel-ignore: skipping data-only bridge upsert"
    exit 0
    ;;
esac
exit 1
