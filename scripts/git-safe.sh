#!/bin/bash
# Git commands that never wait for user input
# Usage: source this file or use the functions directly

# Git status without pager
git-status() {
    git --no-pager status
}

# Git log without pager
git-log() {
    git --no-pager log "$@"
}

# Git diff without pager
git-diff() {
    git --no-pager diff "$@"
}

# Git commit with message (always use -m flag)
git-commit-safe() {
    if [ -z "$1" ]; then
        echo "Error: Commit message required"
        echo "Usage: git-commit-safe 'Your commit message'"
        return 1
    fi
    git commit -m "$1" --no-verify
}



