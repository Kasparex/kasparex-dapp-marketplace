# PowerShell Git commands that never wait for user input
# Usage: Import this module or use the functions directly

# Git status without pager
function Git-Status {
    git --no-pager status
}

# Git log without pager
function Git-Log {
    param([string[]]$Args)
    git --no-pager log @Args
}

# Git diff without pager
function Git-Diff {
    param([string[]]$Args)
    git --no-pager diff @Args
}

# Git commit with message (always use -m flag)
function Git-Commit-Safe {
    param([Parameter(Mandatory=$true)][string]$Message)
    git commit -m $Message --no-verify
}

