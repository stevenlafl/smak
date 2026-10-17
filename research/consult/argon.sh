#!/usr/bin/env bash
# A consult, advice only: Gemini 4 Argon (High) in agy, in plan mode and a sandbox, reads the kit and answers the
# questions of argon-prompt.md. Nothing is edited. The answer is written beside this script, dated.
#
#   bash research/consult/argon.sh [<picture.png>]    a picture to show it (kept out of git: one of a game's own
#                                                      models drawn is the game's)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
kit="$(cd "$here/../.." && pwd)"
picture="${1:-}"
prompt="$(cat "$here/argon-prompt.md")"
extra=()
if [ -n "$picture" ]; then
  prompt="$prompt

The picture: $picture (read it)."
  extra=(--add-dir "$(dirname "$picture")")
fi
out="$here/argon-$(date +%F).md"
cd "$kit"
agy --print "$prompt" --model gemini-4-argon-high --mode plan --sandbox --add-dir "$kit" "${extra[@]}" \
  --output-format text --print-timeout 1800s > "$out"
echo "written: $out"
