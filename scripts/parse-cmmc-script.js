/**
 * Parse CMMC_Triptych_TTS_Narration_Script.txt into 15 slide segments (plain text for TTS).
 * Each segment is the quoted narration for Slide 1..15 (Left/Center/Right per triptych).
 */

const fs = require("fs")
const path = require("path")

const SCRIPT_PATH = path.join(
  __dirname,
  "../components/training/cmmc2/CMMC_Triptych_TTS_Narration_Script.txt"
)

function parseScript(content) {
  const segments = []
  // Normalize curly quotes to straight for matching
  const normalized = content.replace(/\u201C/g, '"').replace(/\u201D/g, '"')
  // Match: Slide N — Title\n"..." (content until closing quote before next Slide or ===)
  const slideBlock = /Slide\s+(\d+)\s+—\s+[^\n]+\n"([\s\S]*?)"\s*(?=\n\nSlide|\n===)/g
  let m
  while ((m = slideBlock.exec(normalized)) !== null) {
    const slideNum = parseInt(m[1], 10)
    let text = m[2]
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
    segments.push({ slideNum, text })
  }
  return segments
}

function run() {
  if (!fs.existsSync(SCRIPT_PATH)) {
    console.error("Script not found:", SCRIPT_PATH)
    process.exit(1)
  }
  const content = fs.readFileSync(SCRIPT_PATH, "utf8")
  const segments = parseScript(content)
  if (segments.length !== 15) {
    console.warn("Expected 15 segments, got", segments.length)
  }
  console.log(JSON.stringify(segments.map((s) => ({ slideNum: s.slideNum, text: s.text })), null, 2))
}

module.exports = { parseScript, SCRIPT_PATH }
if (require.main === module) run()
