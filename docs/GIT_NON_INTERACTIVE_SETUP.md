# Git Non-Interactive Setup

This document explains how Git has been configured to prevent commands from "freezing" or waiting for user input.

## Problem

Git commands like `git status`, `git commit`, or `git log` would sometimes appear to "freeze" because:
1. Git was opening an editor (like vim) for commit messages
2. Git was using a pager (like `less`) that waits for user input to scroll
3. Git was prompting for credentials interactively

## Solution

Git has been configured globally to run non-interactively:

### Configuration Applied

```bash
# Disable editor (git will not open an editor)
git config --global core.editor "true"

# Disable pager (output goes directly to terminal)
git config --global core.pager "cat"

# Store credentials (prevents interactive prompts)
git config --global credential.helper store
```

### Verification

Check your git configuration:
```bash
git config --global --list | grep -E "editor|pager|credential"
```

You should see:
- `core.editor=true`
- `core.pager=cat`
- `credential.helper=store`

## Usage

### Standard Git Commands

All standard git commands should now work without freezing:
- `git status` - No pager, outputs directly
- `git commit -m "message"` - No editor, uses message flag
- `git log` - No pager, outputs directly
- `git diff` - No pager, outputs directly

### Alternative: Use --no-pager Flag

If you want to override the pager for a specific command:
```bash
git --no-pager status
git --no-pager log
git --no-pager diff
```

### Helper Scripts

Two helper scripts are available:
- `scripts/git-safe.sh` - Bash functions for non-interactive git
- `scripts/git-safe.ps1` - PowerShell functions for non-interactive git

## Important Notes

1. **Always use `-m` flag for commits**: When committing, always provide a message with the `-m` flag:
   ```bash
   git commit -m "Your commit message"
   ```
   Never run `git commit` without `-m`, as it will try to open an editor.

2. **Credentials**: The first time you push/pull, Git may prompt for credentials. After that, they're stored and won't prompt again.

3. **If commands still freeze**: Use the `--no-pager` flag explicitly:
   ```bash
   git --no-pager <command>
   ```

## Troubleshooting

If git commands still freeze:

1. Check if an editor is being opened:
   ```bash
   git config --global core.editor
   ```
   Should return `true`, not `vim`, `nano`, etc.

2. Check if pager is disabled:
   ```bash
   git config --global core.pager
   ```
   Should return `cat`, not `less` or `more`.

3. Force non-interactive mode:
   ```bash
   GIT_EDITOR=true git commit -m "message"
   ```



