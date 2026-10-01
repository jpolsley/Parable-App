#!/bin/bash
# Quick test: can Qwen3-VL 8B be Diana's one model for Parable (text + images)?
# Usage:  bash test-qwen3-vl.sh ~/Downloads/reference.webp
# Needs Ollama running on this Mac (the Steward app starts it). Nothing here changes Parable.

set -u
IMG="${1:-}"
MODEL="${PARABLE_VL_MODEL:-qwen3-vl:8b}"
OLLAMA="${OLLAMA_URL:-http://localhost:11434}"

if [ -z "$IMG" ] || [ ! -f "$IMG" ]; then
  echo "Usage: bash test-qwen3-vl.sh /path/to/reference-image"
  echo "Tip: type 'bash test-qwen3-vl.sh ' then drag the image into Terminal and press Return."
  exit 1
fi
if ! curl -s "$OLLAMA/api/tags" >/dev/null; then
  echo "Can't reach Ollama at $OLLAMA. Start the Steward app (or 'ollama serve') and try again."
  exit 1
fi

# Get the model if it isn't here yet (about 6 GB, one time).
if ! curl -s "$OLLAMA/api/tags" | grep -q "\"$MODEL\""; then
  echo "Downloading $MODEL (about 6 GB, one time)..."
  curl -s "$OLLAMA/api/pull" -d "{\"name\":\"$MODEL\",\"stream\":false}" >/dev/null || { echo "Download failed."; exit 1; }
fi

# Free memory: unload other models (16 GB can't hold two).
for m in $(curl -s "$OLLAMA/api/ps" | grep -o '"name":"[^"]*"' | cut -d'"' -f4); do
  [ "$m" != "$MODEL" ] && curl -s "$OLLAMA/api/generate" -d "{\"model\":\"$m\",\"keep_alive\":0}" >/dev/null
done

# Ollama reads JPEG/PNG; convert anything else with the Mac's built-in tool, shrunk to keep it quick.
TMP="$(mktemp -d)"
if ! sips -s format jpeg -Z 1280 "$IMG" --out "$TMP/ref.jpg" >/dev/null 2>&1; then
  echo "Couldn't read \"$IMG\" as a picture. Save the reference as a PNG or JPG (a screenshot works: Cmd+Shift+4) and try again."
  rm -rf "$TMP"; exit 1
fi
base64 -i "$TMP/ref.jpg" | tr -d '\n' > "$TMP/ref.b64"

# Pull the model's answer text out of Ollama's JSON reply (JavaScript is built into every Mac).
answer() { [ -z "$1" ] && { echo "(no reply from Ollama)"; return; }; osascript -l JavaScript -e 'function run(a){var r=JSON.parse(a[0]);return (r.message&&r.message.content)||r.error||"(no answer)"}' "$1"; }
ask() { # $1 = prompt, $2 = include image (yes/no)
  local prompt
  prompt="$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ')"
  # The request goes in a file: an image is far too long for a command line.
  {
    printf '{"model":"%s","stream":false,"think":false,"format":"json","keep_alive":"10m","options":{"temperature":0,"num_ctx":10240},"messages":[{"role":"user","content":"%s"' "$MODEL" "$prompt"
    if [ "$2" = yes ]; then printf ',"images":["'; cat "$TMP/ref.b64"; printf '"]'; fi
    printf '}]}'
  } > "$TMP/body.json"
  local start end out
  start=$(date +%s)
  out="$(curl -s "$OLLAMA/api/chat" -d @"$TMP/body.json")"
  end=$(date +%s)
  answer "$out"
  echo
  echo "($((end - start)) seconds)"
}

echo
echo "=== TEST 1: Look at the reference image ==="
ask 'You are a graphic designer. Describe the visual design of this image so a print designer could recreate its style (not its words) in a curriculum book. Respond with JSON only: {"palette":[{"hex":"#RRGGBB","role":"background|ink|accent|secondary"}],"typography":{"display":"describe headline type","labels":"describe small text"},"composition":{"layout":"","movement":"","density":""},"motifs":["each repeated shape or graphic device you see"],"mood":"a few words","interior_pages":"how this style should carry into calm, readable lesson pages"}' yes

echo
echo "=== TEST 2: A normal design request, no image ==="
ask 'You adjust the look of a printed curriculum book. Current design: {"palette":{"paper":"#FFFFFF","ink":"#0F172A","accent":"#059669"},"cover":{"motifs":[{"type":"x","count":4},{"type":"band","width":0.08}]}}. The leader says: "The Xs are too much, and make the coral band wider." Return JSON with ONLY the fields that change, using the same structure.' no

echo
echo "=== TEST 3: Plain writing, no image ==="
ask 'Write 3 small group discussion questions for teenagers about Luke 5:27-32 (Jesus eats with Levi). Respond as {"questions":["...","...","..."]}.' no

rm -rf "$TMP"
echo
echo "Done. Copy everything above and paste it back into the chat."
