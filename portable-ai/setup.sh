#!/bin/bash
# Parable Portable AI: puts Ollama and a local model on a flash drive so Parable's
# AI helpers work on any Mac you plug the drive into. Nothing is installed on the Mac.
#
# Usage:  bash setup.sh "/Volumes/YOUR DRIVE"
# Change the model with:  PARABLE_MODEL=qwen2.5:7b bash setup.sh "/Volumes/YOUR DRIVE"

set -euo pipefail

MODEL="${PARABLE_MODEL:-qwen3:8b}"
SITE="https://jpolsley.github.io/Parable-App/"
ORIGIN="https://jpolsley.github.io"
OLLAMA_URL="https://github.com/ollama/ollama/releases/latest/download/ollama-darwin.tgz"
NEED_GB=9

say() { printf '\n\033[1m%s\033[0m\n' "$1"; }
fail() { printf '\n\033[31m%s\033[0m\n\n' "$1"; exit 1; }

[ "$(uname)" = "Darwin" ] || fail "This setup is for a Mac."

DRIVE="${1:-}"
[ -n "$DRIVE" ] || fail 'Tell me which drive to use, e.g.:  bash setup.sh "/Volumes/PARABLE"'
DRIVE="${DRIVE%/}"
[ -d "$DRIVE" ] || fail "Can't find $DRIVE. Is the flash drive plugged in?"
case "$DRIVE" in /Volumes/*) ;; *) fail "$DRIVE doesn't look like a flash drive (it should start with /Volumes/)." ;; esac

# FAT32 can't hold files over 4 GB, and the model is bigger than that.
FS="$(diskutil info "$DRIVE" 2>/dev/null | awk -F': *' '/File System Personality/ {print $2}' || true)"
case "$FS" in
  *FAT32*|MS-DOS*|*FAT16*)
    fail "The drive is formatted as $FS, which can't hold the 5 GB model.
Open Disk Utility, select the drive, click Erase, and choose ExFAT (this erases the drive), then run this again." ;;
esac

FREE_GB=$(( $(df -Pk "$DRIVE" | awk 'NR==2 {print $4}') / 1024 / 1024 ))
[ "$FREE_GB" -ge "$NEED_GB" ] || fail "The drive has ${FREE_GB} GB free; it needs about ${NEED_GB} GB."

if curl -fs --max-time 2 http://127.0.0.1:11434/api/version >/dev/null 2>&1; then
  fail "Ollama is already running on this Mac. Quit it from the menu bar (llama icon → Quit Ollama), then run this again."
fi

HOME_DIR="$DRIVE/ParableAI"
mkdir -p "$HOME_DIR/ollama" "$HOME_DIR/models" "$HOME_DIR/logs"
echo "$MODEL" > "$HOME_DIR/model.txt"

say "1/3  Downloading Ollama (about 160 MB)…"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fL --progress-bar -o "$TMP/ollama.tgz" "$OLLAMA_URL"
mkdir -p "$TMP/x"
tar -xzf "$TMP/ollama.tgz" -C "$TMP/x"
rm -rf "${HOME_DIR:?}/ollama"/*
# -L copies the files that symlinks point to (ExFAT drives can't store symlinks);
# -X skips extended attributes so macOS doesn't litter the drive with ._ files.
cp -RLX "$TMP/x/." "$HOME_DIR/ollama/"
chmod +x "$HOME_DIR/ollama/ollama" 2>/dev/null || true
xattr -dr com.apple.quarantine "$HOME_DIR/ollama" 2>/dev/null || true
"$HOME_DIR/ollama/ollama" --version >/dev/null 2>&1 || fail "Ollama didn't start from the drive. Try a different flash drive or reformat it as ExFAT."

# The launcher is written here (not downloaded) so macOS doesn't block it.
cat > "$HOME_DIR/Start Parable AI.command" <<'START'
#!/bin/bash
# Double-click to start Parable's AI from this flash drive. Close the window to stop it.
DIR="$(cd "$(dirname "$0")" && pwd)"
BIN="$DIR/ollama/ollama"
MODEL="$(cat "$DIR/model.txt" 2>/dev/null || echo qwen3:8b)"
export OLLAMA_MODELS="$DIR/models"
export OLLAMA_HOST="127.0.0.1:11434"
export OLLAMA_ORIGINS="https://jpolsley.github.io"
export OLLAMA_KEEP_ALIVE="30m"

clear
printf '\n  \033[1mParable AI\033[0m  (running from your flash drive)\n\n'

if curl -fs --max-time 2 http://127.0.0.1:11434/api/version >/dev/null 2>&1; then
  printf '  Ollama is already running on this Mac.\n  Quit it from the menu bar (llama icon → Quit Ollama), then double-click this again.\n\n'
  read -r -n 1 -p "  Press any key to close." _; exit 1
fi

"$BIN" serve >"$DIR/logs/ollama.log" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null; wait $PID 2>/dev/null; printf "\n\n  Parable AI stopped. You can eject the drive now.\n\n"' EXIT

printf '  Starting…'
for _ in $(seq 1 60); do
  curl -fs --max-time 1 http://127.0.0.1:11434/api/version >/dev/null 2>&1 && break
  sleep 1
done
curl -fs --max-time 2 http://127.0.0.1:11434/api/version >/dev/null 2>&1 || { printf '\n  Ollama did not start. Details are in ParableAI/logs/ollama.log\n'; read -r -n 1 _; exit 1; }

if ! "$BIN" list 2>/dev/null | awk 'NR>1 {print $1}' | grep -qx "$MODEL"; then
  printf '\n  Downloading %s (one time only)…\n' "$MODEL"
  "$BIN" pull "$MODEL" || { printf '\n  Download failed. Check your internet and try again.\n'; read -r -n 1 _; exit 1; }
fi

# Load the model into memory now so the first request in Parable isn't the slow one.
printf '\r  Loading %s into memory (about a minute from a flash drive)…' "$MODEL"
curl -fs http://127.0.0.1:11434/api/generate -d "{\"model\":\"$MODEL\",\"keep_alive\":\"30m\"}" >/dev/null 2>&1

printf '\r\033[K  \033[32mReady.\033[0m\n\n'
printf '  In Parable, click "AI" (top right), turn on the helpers, and enter:\n'
printf '     Server URL:  http://localhost:11434/v1\n'
printf '     Model:       %s\n\n' "$MODEL"
printf '  Leave this window open while you use Parable.\n'
printf '  Close it (or press Control-C) when you are done, then eject the drive.\n'

open -a "Google Chrome" "https://jpolsley.github.io/Parable-App/" 2>/dev/null || open "https://jpolsley.github.io/Parable-App/"
wait $PID
START
chmod +x "$HOME_DIR/Start Parable AI.command" 2>/dev/null || true

cat > "$HOME_DIR/READ ME.txt" <<README
Parable AI on a flash drive
===========================

To use it:
  1. Plug in this drive.
  2. Open the ParableAI folder and double-click "Start Parable AI".
     (The first time on a new Mac, macOS may ask to allow it: right-click the file,
     choose Open, then Open again.)
  3. When it says Ready, Parable opens in your browser. In Parable, click "AI"
     in the top right, turn on the helpers, and enter:
        Server URL:  http://localhost:11434/v1
        Model:       $MODEL
     Then click Test connection and Save. You only enter this once per browser.
  4. When you're done, close the Terminal window, then eject the drive.

Tips:
  - Use Chrome or Firefox. Safari may block the connection.
  - If the Ollama app is also installed on the Mac, quit it first (llama icon in the menu bar).
  - The model loads from the drive when you start, which takes about a minute.
  - Problems? See logs/ollama.log.

Model: $MODEL
Site:  $SITE
README

say "2/3  Downloading $MODEL onto the drive (about 5 GB; this can take a while)…"
export OLLAMA_MODELS="$HOME_DIR/models" OLLAMA_HOST="127.0.0.1:11434" OLLAMA_ORIGINS="$ORIGIN"
"$HOME_DIR/ollama/ollama" serve >"$HOME_DIR/logs/setup.log" 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null; rm -rf "$TMP"' EXIT
for _ in $(seq 1 60); do
  curl -fs --max-time 1 http://127.0.0.1:11434/api/version >/dev/null 2>&1 && break
  sleep 1
done
"$HOME_DIR/ollama/ollama" pull "$MODEL" || fail "The model download failed. Check your internet connection and run this again; it picks up where it left off."

say "3/3  Quick test…"
REPLY="$(curl -fs http://127.0.0.1:11434/api/generate -d "{\"model\":\"$MODEL\",\"prompt\":\"Reply with just the word: ready\",\"stream\":false,\"think\":false}" | sed -n 's/.*"response":"\([^"]*\)".*/\1/p' || true)"
kill $SERVER 2>/dev/null; wait $SERVER 2>/dev/null || true
echo "  The model says: ${REPLY:-"(no reply, but it's installed)"}"

say "All set!"
cat <<DONE
  Everything lives in:  $HOME_DIR

  Every time you want to use it:
    1. Double-click "Start Parable AI" in that folder.
    2. When it says Ready, Parable opens. The first time, click "AI" in Parable
       and enter  http://localhost:11434/v1  and  $MODEL
    3. Close the Terminal window when you're done, then eject the drive.

DONE
open "$HOME_DIR" 2>/dev/null || true
