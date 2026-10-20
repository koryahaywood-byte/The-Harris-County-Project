#!/bin/zsh
# launchd runner (com.hcp.early-vote): the county posts cumulative early-voting
# and mail-ballot rosters each morning (~8 a.m.). Rebuild the tracker and publish
# public/data/early-vote-2026.json when the numbers move. Commits only that file.
set -u
cd /Users/dapr/harris-county-project || exit 1
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
LOG="$HOME/Library/Logs/hcp-routines/early-vote.log"
mkdir -p "${LOG:h}"
F=public/data/early-vote-2026.json
key() { node -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8"));console.log(d.through+"|"+d.totals.all)'; }

echo "$(date '+%F %T') run" >> "$LOG"
before=$(git show HEAD:$F 2>/dev/null | key)
node --max-old-space-size=6144 scripts/build-early-vote.mjs >> "$LOG" 2>&1 || { echo "$(date '+%F %T') build failed" >> "$LOG"; exit 1; }
after=$(key < $F)
if [[ "$before" == "$after" ]]; then
  git checkout -- $F 2>/dev/null   # only the timestamp moved
  echo "$(date '+%F %T') no new roster ($after)" >> "$LOG"; exit 0
fi
total=${after#*|}; through=${after%|*}
git commit -q -m "Early vote: through $through, $(printf "%'d" $total) ballots

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- $F >> "$LOG" 2>&1
git pull -q --rebase --autostash origin main >> "$LOG" 2>&1
git push -q origin main >> "$LOG" 2>&1 && echo "$(date '+%F %T') published $after" >> "$LOG" || echo "$(date '+%F %T') push failed" >> "$LOG"
