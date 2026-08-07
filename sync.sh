#!/usr/bin/env bash
# Pull Sai's grounding deck from HIS repo and re-vendor it into src/.
#
# This OVERWRITES src/grounding.* — only run it when Sai has actually pushed to
# documentgrounding.github.io. If he commits changes straight into this repo
# instead (new slides, new figures), they already live in src/grounding.* and an
# ordinary `python3 build.py` keeps them; running this would throw them away.
set -euo pipefail
cd "$(dirname "$0")"

UPSTREAM_URL="https://github.com/SaiMadhusudan/documentgrounding.github.io.git"
UPSTREAM_DIR=".upstream/grounding"

if [ "${1:-}" != "--yes" ]; then
  echo "This replaces src/grounding.* with Sai's repo, discarding any grounding"
  echo "changes committed directly into this repo."
  echo "Re-run as: ./sync.sh --yes"
  exit 1
fi

if [ -d "$UPSTREAM_DIR/.git" ]; then
  git -C "$UPSTREAM_DIR" fetch --quiet origin
  git -C "$UPSTREAM_DIR" reset --hard --quiet origin/HEAD
else
  mkdir -p "$(dirname "$UPSTREAM_DIR")"
  git clone --quiet "$UPSTREAM_URL" "$UPSTREAM_DIR"
fi
echo "→ upstream at $(git -C "$UPSTREAM_DIR" log --oneline -1)"
python3 build.py --sync-upstream
echo
echo "Review before committing:  git diff --stat"
