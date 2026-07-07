#!/bin/zsh
# Headless runner for the Harris County Project routines, fired by launchd.
# Usage: run-routine.sh <task-id>   (task-id = dir under ~/.claude/scheduled-tasks)
#
# Guard: if the Claude desktop app is running, its own scheduler owns these
# tasks — exit quietly so a routine never runs twice in one slot. launchd is
# strictly the "app is closed" fallback.

set -u
TASK_ID="${1:?usage: run-routine.sh <task-id>}"
SKILL="$HOME/.claude/scheduled-tasks/$TASK_ID/SKILL.md"
LOGDIR="$HOME/Library/Logs/hcp-routines"
LOG="$LOGDIR/$TASK_ID.log"
mkdir -p "$LOGDIR"

export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

if pgrep -fq "/Applications/Claude.app/Contents/MacOS/Claude"; then
  echo "$(date '+%F %T') skip: Claude desktop app is running (its scheduler owns $TASK_ID)" >> "$LOG"
  exit 0
fi

if [[ ! -f "$SKILL" ]]; then
  echo "$(date '+%F %T') error: $SKILL not found" >> "$LOG"
  exit 1
fi

# Strip YAML frontmatter; the body is the task prompt (single source of truth
# shared with the app's scheduler — edit the SKILL.md, both runners follow).
PROMPT="$(awk 'BEGIN{fm=0} /^---$/{fm++; next} fm>=2 || fm==0 {print}' "$SKILL")"

echo "$(date '+%F %T') start $TASK_ID" >> "$LOG"
cd "$HOME/harris-county-project" || exit 1
claude -p "$PROMPT" --dangerously-skip-permissions >> "$LOG" 2>&1
echo "$(date '+%F %T') done $TASK_ID (exit $?)" >> "$LOG"
