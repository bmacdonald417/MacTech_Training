/**
 * Generate TTS for CMMC triptych script and build narration_timeline.json with exact timings.
 * Requires: OPENAI_API_KEY, optional: ffmpeg for concatenating to one MP3 per triptych.
 *
 * Usage: node scripts/generate-cmmc-triptych-audio.js
 *
 * Outputs:
 * - public/triptych-player/audio/segments/seg_01.mp3 ... seg_15.mp3
 * - public/triptych-player/audio/triptych_01.mp3 ... triptych_05.mp3 (if ffmpeg available)
 * - public/triptych-player/narration_timeline.json (updated with audioUrl and exact segments)
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")
const { parseScript } = require("./parse-cmmc-script")
const getMP3Duration = require("get-mp3-duration")

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"
const TTS_MODEL = "tts-1"
const VOICE = "alloy"
const MAX_INPUT = 4096
const INTRO_SEC = 1.5
const RECAP_SEC = 2.0

const ROOT = path.join(__dirname, "..")
const SCRIPT_PATH = path.join(ROOT, "components/training/cmmc2/CMMC_Triptych_TTS_Narration_Script.txt")
const AUDIO_DIR = path.join(ROOT, "public/triptych-player/audio")
const SEGMENTS_DIR = path.join(AUDIO_DIR, "segments")
const TIMELINE_PATH = path.join(ROOT, "public/triptych-player/narration_timeline.json")

const TITLES = [
  "Welcome to CMMC Level 2 Training",
  "CMMC Level 2: Protecting CUI",
  "Threat Landscape and FCI vs CUI",
  "Acceptable Use and Identity",
  "Role-Based Training and Manager Module",
]

async function generateTTS(apiKey, text) {
  const trimmed = text.slice(0, MAX_INPUT)
  const res = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      input: trimmed,
      voice: VOICE,
      response_format: "mp3",
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`TTS failed: ${res.status} ${err}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

function getDurationMs(buffer) {
  return getMP3Duration(buffer)
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

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

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error("Set OPENAI_API_KEY to generate TTS.")
    process.exit(1)
  }
  if (!fs.existsSync(SCRIPT_PATH)) {
    console.error("Script not found:", SCRIPT_PATH)
    process.exit(1)
  }

  const content = fs.readFileSync(SCRIPT_PATH, "utf8")
  const segments = parseScript(content)
  if (segments.length !== 15) {
    console.error("Expected 15 segments, got", segments.length)
    process.exit(1)
  }

  ensureDir(SEGMENTS_DIR)

  const durationsSec = []
  for (let i = 0; i < 15; i++) {
    const seg = segments[i]
    const num = String(i + 1).padStart(2, "0")
    const outPath = path.join(SEGMENTS_DIR, `seg_${num}.mp3`)
    console.log(`Generating segment ${i + 1}/15...`)
    const buffer = await generateTTS(apiKey, seg.text)
    fs.writeFileSync(outPath, buffer)
    const ms = getDurationMs(buffer)
    durationsSec.push(ms / 1000)
  }

  const slides = []
  for (let t = 0; t < 5; t++) {
    const i0 = t * 3
    const d1 = durationsSec[i0]
    const d2 = durationsSec[i0 + 1]
    const d3 = durationsSec[i0 + 2]
    const leftStart = INTRO_SEC
    const centerStart = leftStart + d1
    const rightStart = centerStart + d2
    const recapStart = rightStart + d3
    const end = recapStart + RECAP_SEC
    slides.push({
      image: "assets/triptych_" + String(t + 1).padStart(2, "0") + ".png",
      title: TITLES[t],
      audioUrl: "audio/triptych_" + String(t + 1).padStart(2, "0") + ".mp3",
      segments: {
        introStart: 0,
        leftStart: Math.round(leftStart * 10) / 10,
        centerStart: Math.round(centerStart * 10) / 10,
        rightStart: Math.round(rightStart * 10) / 10,
        recapStart: Math.round(recapStart * 10) / 10,
        end: Math.round(end * 10) / 10,
      },
      panels: null,
    })
  }

  try {
    for (let t = 0; t < 5; t++) {
      const num = String(t + 1).padStart(2, "0")
      const inputs = [1, 2, 3].map((k) => path.join(SEGMENTS_DIR, `seg_${String(t * 3 + k).padStart(2, "0")}.mp3`))
      const outPath = path.join(AUDIO_DIR, `triptych_${num}.mp3`)
      console.log("Concatenating triptych", t + 1, "...")
      concatMP3s(inputs, outPath)
    }
  } catch (e) {
    console.warn("Concatenation skipped:", e.message)
    for (const s of slides) delete s.audioUrl
  }

  const timeline = {
    global: { dimOpacity: 0.624, transitionMs: 450 },
    slides,
  }
  fs.writeFileSync(TIMELINE_PATH, JSON.stringify(timeline, null, 2))
  console.log("Wrote", TIMELINE_PATH)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
