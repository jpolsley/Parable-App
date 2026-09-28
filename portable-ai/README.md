# Parable AI on a flash drive

Run Parable's AI helpers from a USB flash drive on any Mac. Ollama and the model live on the
drive; nothing is installed on the computer.

**Model:** Qwen 3, 8B (`qwen3:8b`). It's the smartest model that runs well on a Mac with 16 GB
of memory, and it's good at the structured drafts Parable asks for.

## What you need

- A flash drive with **at least 16 GB**, formatted **ExFAT** or **Mac OS Extended / APFS**.
  (FAT32 can't hold the 5 GB model. Disk Utility → select the drive → Erase → ExFAT.)
- A Mac with 16 GB of memory, and internet for the one-time setup.

## One-time setup (about 15–30 minutes, mostly downloading)

1. Plug in the flash drive.
2. Open **Terminal** (press ⌘-Space, type Terminal, press Return).
3. Type this, followed by a space, but **don't press Return yet**:

   ```
   curl -fsSL https://raw.githubusercontent.com/jpolsley/Parable-App/main/portable-ai/setup.sh | bash -s --
   ```

4. Drag your flash drive's icon from the desktop (or Finder's sidebar) into the Terminal
   window. Its location, like `/Volumes/PARABLE`, appears at the end of the line.
5. Press **Return**. The script downloads Ollama (about 160 MB) and Qwen 3 (about 5 GB) onto the
   drive, runs a quick test, and opens the new **ParableAI** folder.

## Every time you use it

1. Plug in the drive, open the **ParableAI** folder, and double-click **Start Parable AI**.
   The first time on a Mac, macOS may ask for permission: right-click it, choose **Open**, then **Open**.
2. Wait for **Ready** (about a minute while the model loads from the drive). Parable opens.
3. The first time in each browser: in Parable, click **AI** (top right) → **Use my flash drive AI**
   → **Test connection** → **Save**.
4. When you're finished, close the Terminal window, then eject the drive.

## Good to know

- Use **Chrome** or **Firefox**. Safari may block the connection to the drive.
- If the regular Ollama app is installed on the Mac, quit it first (llama icon in the menu bar).
- Drafts take about a minute on an Intel Mac; Apple Silicon Macs are much faster.
- To use a different model, set it before running setup, e.g.
  `PARABLE_MODEL=qwen2.5:7b bash setup.sh "/Volumes/PARABLE"`, or change `model.txt` on the
  drive and pick the same name in Parable's AI settings.
