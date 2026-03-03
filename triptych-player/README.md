# Triptych Training Player

Lightweight web-based presentation player for comic-style CMMC triptych slides. One full image per slide; guided focus (dim overlays + active border) synced to narration timings. No PowerPoint or VBA required.

## How to run

- **Local file**: Open `index.html` in a browser. For timeline loading to work, serve the folder over HTTP (many browsers block `file://` for `fetch`/XHR). Use any static server, e.g.:
  - `npx serve .`
  - `python3 -m http.server 8000`
  - From repo root: `npx serve MacTech_Training/triptych-player`
- **Static host**: Upload the entire `triptych-player` folder (including `assets/`, `narration_timeline.json`, `index.html`, `styles.css`, `app.js`) to any static host.

## Project structure

```
triptych-player/
  index.html
  styles.css
  app.js
  narration_timeline.json
  README.md
  assets/
    triptych_01.png … triptych_05.png
```

## Replacing images

- Place PNGs (or other image formats) in `assets/`.
- Update `narration_timeline.json`: set each slide’s `"image"` to the path, e.g. `"assets/triptych_01.png"`.
- Optional: copy the canonical triptych assets from `../components/training/cmmc2/` into `assets/` if you haven’t already.

## Editing timings

- Edit `narration_timeline.json`. Each slide has a `segments` object:
  - `introStart`, `leftStart`, `centerStart`, `rightStart`, `recapStart`, `end` (seconds).
- **Calibration mode**: During playback or when paused, use `[` and `]` to nudge the current segment start by ±0.25 s. Press `S` to download a `narration_timeline_calibrated.json` with the current slide’s adjusted segment; merge that into your main JSON as needed.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| **1** | Focus Left panel |
| **2** | Focus Center panel |
| **3** | Focus Right panel |
| **0** | Recap (all panels clear) |
| **N** or **→** | Next slide |
| **P** or **←** | Previous slide |
| **Space** | Play / Pause |
| **[** | Nudge segment start −0.25 s (calibration) |
| **]** | Nudge segment start +0.25 s (calibration) |
| **S** | Save calibrated timings (download JSON) |

## Optional: custom panel coordinates

By default, panels are equal left/center/right thirds. To use custom zones, set `panels` per slide in `narration_timeline.json`:

```json
"panels": {
  "left":   { "x": 0.0, "y": 0.0, "w": 0.333, "h": 1.0 },
  "center": { "x": 0.333, "y": 0.0, "w": 0.334, "h": 1.0 },
  "right":  { "x": 0.667, "y": 0.0, "w": 0.333, "h": 1.0 }
}
```

Coordinates are normalized (0–1). Use `null` for a slide to keep equal thirds.

## Export as static package

Zip or copy the folder contents (including `assets/` and `narration_timeline.json`) to another location or server. No build step; plain HTML/CSS/JS only.

## Integration with this repo

- Triptych images and the CMMC narration script live in `components/training/cmmc2/`.
- This player is self-contained under `triptych-player/` and does not depend on the Next.js app. To use the same assets, copy (or symlink) `triptych_01.png`–`triptych_05.png` from `components/training/cmmc2/` into `triptych-player/assets/`.
