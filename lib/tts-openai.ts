/**
 * OpenAI TTS: generate MP3 buffer from text.
 * Used by the TTS API route and by scripts that batch-generate narration.
 */

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"
const TTS_MODEL_PREFERRED = "gpt-4o-mini-tts"
const TTS_MODEL_FALLBACK = "tts-1"
const DEFAULT_VOICE = "alloy"
export const MAX_TTS_INPUT_LENGTH = 4096

const ALLOWED_VOICES = new Set([
  "alloy",
  "nova",
  "shimmer",
  "echo",
  "onyx",
  "fable",
])

export type GenerateTtsResult =
  | { ok: true; buffer: Buffer; modelUsed: string }
  | { ok: false; error: string }

/**
 * Call OpenAI TTS API and return MP3 buffer.
 * Uses OPENAI_API_KEY from env. Trims input to MAX_TTS_INPUT_LENGTH.
 */
export async function generateTtsMp3(
  text: string,
  voice: string = DEFAULT_VOICE
): Promise<GenerateTtsResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { ok: false, error: "OPENAI_API_KEY is not set." }
  }

  const voiceToUse = ALLOWED_VOICES.has(voice) ? voice : DEFAULT_VOICE
  const trimmed = text.slice(0, MAX_TTS_INPUT_LENGTH).trim()
  if (!trimmed) {
    return { ok: false, error: "No text to convert to speech." }
  }

  try {
    const res = await fetch(OPENAI_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: TTS_MODEL_PREFERRED,
        input: trimmed,
        voice: voiceToUse,
        response_format: "mp3",
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      if (
        res.status === 404 ||
        errText.includes("model") ||
        errText.includes("gpt-4o-mini-tts")
      ) {
        const fallback = await fetch(OPENAI_TTS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: TTS_MODEL_FALLBACK,
            input: trimmed,
            voice: voiceToUse,
            response_format: "mp3",
          }),
        })
        if (!fallback.ok) {
          const fallbackText = await fallback.text()
          console.error("[tts-openai] Fallback failed:", fallback.status, fallbackText)
          return { ok: false, error: "TTS failed (fallback model)." }
        }
        const buffer = Buffer.from(await fallback.arrayBuffer())
        return { ok: true, buffer, modelUsed: TTS_MODEL_FALLBACK }
      }
      console.error("[tts-openai] OpenAI error:", res.status, errText)
      return { ok: false, error: `TTS failed: ${res.status}` }
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    return { ok: true, buffer, modelUsed: TTS_MODEL_PREFERRED }
  } catch (e) {
    console.error("[tts-openai] Request error:", e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : "TTS request failed.",
    }
  }
}
