/**
 * Parse a CMMC-style quiz markdown file into quiz data for the DB.
 * Format: **N. Question text** then a) b) c) d) lines then **Answer: x**
 */

import { readFileSync } from "fs"
import path from "path"

export interface ParsedChoice {
  text: string
  isCorrect: boolean
  order: number
}

export interface ParsedQuestion {
  text: string
  type: "MULTIPLE_CHOICE"
  explanation: string | null
  order: number
  choices: ParsedChoice[]
}

export interface ParsedQuizData {
  passingScore: number
  allowRetry: boolean
  showAnswersAfter: boolean
  questions: ParsedQuestion[]
}

const QUESTION_START = /^\*\*(\d+)\.\s+(.+)\*\*$/
const CHOICE_LINE = /^([a-d])\)\s+(.+)$/
const ANSWER_LINE = /^\*\*Answer:\s*([a-d])\*\*$/i

/** Parse markdown content string into quiz data */
export function parseQuizMarkdown(markdown: string): ParsedQuizData {
  const lines = markdown.split(/\r?\n/)
  const questions: ParsedQuestion[] = []
  let i = 0

  while (i < lines.length) {
    const qMatch = lines[i].match(QUESTION_START)
    if (!qMatch) {
      i++
      continue
    }

    const order = parseInt(qMatch[1], 10)
    const text = qMatch[2].trim()
    i++

    const choices: ParsedChoice[] = []
    let correctLetter: string | null = null

    while (i < lines.length) {
      const line = lines[i]
      const choiceMatch = line.match(CHOICE_LINE)
      const answerMatch = line.match(ANSWER_LINE)

      if (choiceMatch) {
        const letter = choiceMatch[1].toLowerCase()
        const choiceText = choiceMatch[2].trim()
        choices.push({
          text: choiceText,
          isCorrect: false, // set when we see Answer
          order: choices.length + 1,
        })
        i++
        continue
      }

      if (answerMatch) {
        correctLetter = answerMatch[1].toLowerCase()
        i++
        break
      }

      // Next question (same format as start) — stop so we don't consume it
      if (line.match(QUESTION_START)) break
      if (line.match(/^#{1,6}\s/)) break
      i++
    }

    if (correctLetter) {
      const idx = correctLetter.charCodeAt(0) - "a".charCodeAt(0)
      if (choices[idx]) choices[idx].isCorrect = true
    }

    if (choices.length >= 2) {
      questions.push({
        text,
        type: "MULTIPLE_CHOICE",
        explanation: null,
        order,
        choices,
      })
    }
  }

  return {
    passingScore: 80,
    allowRetry: true,
    showAnswersAfter: true,
    questions: questions.sort((a, b) => a.order - b.order),
  }
}

/** Default path to the CMMC Level 2 Security Awareness Training Quiz markdown (from project root) */
export const CMMC_QUIZ_MD_PATH = path.join(
  process.cwd(),
  "app",
  "api",
  "org",
  "[slug]",
  "quizzes",
  "CMMC Level 2 Security Awareness Training Quiz.md"
)

/** Load and parse the CMMC quiz markdown file from the default path */
export function loadCmmcQuizFromMarkdown(filePath: string = CMMC_QUIZ_MD_PATH): ParsedQuizData {
  const content = readFileSync(filePath, "utf-8")
  return parseQuizMarkdown(content)
}
