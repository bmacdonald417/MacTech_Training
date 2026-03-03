/**
 * Concatenate existing segment MP3s into one per triptych and add audioUrl to narration_timeline.json.
 * Run after generate-cmmc-triptych-audio.js when ffmpeg was missing (e.g. after installing ffmpeg-static).
 *
 * Usage: node scripts/concat-triptych-audio-only.js
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const ROOT = path.join(__dirname, "..")
const AUDIO_DIR = path.join(ROOT, "public/triptych-player/audio")
const SEGMENTS_DIR = path.join(AUDIO_DIR, "segments")
const TIMELINE_PATH = path.join(ROOT, "public/triptych-player/narration_timeline.json")

function getFfmpegPath() {
  try {
    execSync("which ffmpeg 2>/dev/null || where ffmpeg 2>nul", { encoding: "utf8" })
    return "ffmpeg"
  } catch (_) {}
  try {
    return require("ffmpeg-static")
  } catch (_) {}
  return null
}

function concatMP3s(inputPaths, outputPath) {
  const ffmpeg = getFfmpegPath()
  if (!ffmpeg) throw new Error("ffmpeg not found (install ffmpeg or ffmpeg-static)")
  const listPath = outputPath + ".list.txt"
  const listContent = inputPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n")
  fs.writeFileSync(listPath, listContent)
  try {
    execSync(
      `"${ffmpeg}" -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`,
      { stdio: "inherit" }
    )
  } finally {
    try { fs.unlinkSync(listPath) } catch (_) {}
  }
}

function main() {
  if (!fs.existsSync(TIMELINE_PATH)) {
    console.error("Timeline not found:", TIMELINE_PATH)
    process.exit(1)
  }
  const timeline = JSON.parse(fs.readFileSync(TIMELINE_PATH, "utf8"))
  if (!timeline.slides || timeline.slides.length !== 5) {
    console.error("Timeline must have 5 slides.")
    process.exit(1)
  }
  for (let t = 0; t < 5; t++) {
    const num = String(t + 1).padStart(2, "0")
    const inputs = [1, 2, 3].map((k) =>
      path.join(SEGMENTS_DIR, `seg_${String(t * 3 + k).padStart(2, "0")}.mp3`)
    )
    if (!inputs.every((p) => fs.existsSync(p))) {
      console.error("Missing segment(s) for triptych", t + 1)
      process.exit(1)
    }
    const outPath = path.join(AUDIO_DIR, `triptych_${num}.mp3`)
    console.log("Concatenating triptych", t + 1, "...")
    concatMP3s(inputs, outPath)
    timeline.slides[t].audioUrl = "audio/triptych_" + num + ".mp3"
  }
  fs.writeFileSync(TIMELINE_PATH, JSON.stringify(timeline, null, 2))
  console.log("Updated", TIMELINE_PATH, "with audioUrl for each slide.")
}

main()
