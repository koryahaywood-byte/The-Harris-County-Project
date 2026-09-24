#!/bin/zsh
# Hourly launchd runner for scripts/build-player-models.mjs (com.hcp.player-models).
# The Hugging Face GPU quota is small and resets 24 hours after first use, so each
# run builds what it can and stops; cached steps resume on the next run. New models
# land as review: "pending" and stay off the live site until approved.
set -u
cd /Users/dapr/harris-county-project || exit 1
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
LOG="$HOME/Library/Logs/hcp-routines/player-models.log"
mkdir -p "${LOG:h}"

grep -qE '^(FAL_KEY|HF_TOKEN)=.{8,}' .env.local 2>/dev/null || exit 0   # no key yet
LOCK=".player-models/.lock"
mkdir -p .player-models
if ! mkdir "$LOCK" 2>/dev/null; then
  # A run older than 3 hours is stuck; clear it.
  [[ -n $(find "$LOCK" -maxdepth 0 -mmin +180) ]] && rmdir "$LOCK" && mkdir "$LOCK" || exit 0
fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

echo "$(date '+%F %T') run" >> "$LOG"
env $(grep -v '^#' .env.local | xargs) node scripts/build-player-models.mjs --all >> "$LOG" 2>&1
echo "$(date '+%F %T') exit $?" >> "$LOG"
