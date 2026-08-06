#!/usr/bin/env bash
# Pull Sai's latest grounding deck and rebuild index.html around it.
set -euo pipefail
cd "$(dirname "$0")"

UPSTREAM_URL="https://github.com/SaiMadhusudan/documentgrounding.github.io.git"
UPSTREAM_DIR=".upstream/grounding"

if [ -d "$UPSTREAM_DIR/.git" ]; then
  echo "→ pulling $UPSTREAM_URL"
  git -C "$UPSTREAM_DIR" fetch --quiet origin
  git -C "$UPSTREAM_DIR" reset --hard --quiet origin/HEAD
else
  echo "→ cloning $UPSTREAM_URL"
  mkdir -p "$(dirname "$UPSTREAM_DIR")"
  git clone --quiet "$UPSTREAM_URL" "$UPSTREAM_DIR"
fi

echo "→ upstream is now at $(git -C "$UPSTREAM_DIR" log --oneline -1)"
python3 build.py
echo
echo "Review what changed, then commit:"
echo "  git diff --stat"
