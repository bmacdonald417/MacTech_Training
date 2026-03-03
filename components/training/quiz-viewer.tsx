"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, RotateCcw, Award, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuizViewerProps {
  quiz: any
  enrollmentId: string
  orgSlug: string
  userId: string
  onComplete: () => void
  isCompleted: boolean
  isSubmitting?: boolean
}

export function QuizViewer({
  quiz,
  enrollmentId,
  orgSlug,
  userId,
  onComplete,
  isCompleted,
  isSubmitting: isSubmittingProp = false,
}: QuizViewerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [passed, setPassed] = useState<boolean | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [showExplanations, setShowExplanations] = useState(false)
  const [canRetry, setCanRetry] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<"questions" | "summary">("questions")
  const [hashCopied, setHashCopied] = useState(false)
  const [hashHex, setHashHex] = useState<string | null>(null)
  const submitting = isSubmitting || isSubmittingProp

  const wrongQuestions = useMemo(() => {
    if (!submitted || !quiz?.questions) return []
    return quiz.questions.filter((q: any) => {
      const userChoiceId = answers[q.id]
      const correct = q.choices.find((c: any) => c.isCorrect)
      return userChoiceId !== correct?.id
    })
  }, [submitted, quiz?.questions, answers])

  const verificationHash = useMemo(() => {
    if (!attemptId || !userId || score === null || passed === null) return null
    const payload = `${attemptId}:${userId}:${score}:${passed}:${quiz?.id ?? ""}`
    return payload
  }, [attemptId, userId, score, passed, quiz?.id])

  async function computeHashHex(payload: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(payload)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  useEffect(() => {
    if (!verificationHash) return
    computeHashHex(verificationHash).then(setHashHex)
  }, [verificationHash])

  async function copyHash() {
    if (!verificationHash) return
    try {
      const hex = hashHex ?? (await computeHashHex(verificationHash))
      if (!hashHex && hex) setHashHex(hex)
      await navigator.clipboard.writeText(hex)
      setHashCopied(true)
      setTimeout(() => setHashCopied(false), 2000)
    } catch {
      await navigator.clipboard.writeText(verificationHash)
      setHashCopied(true)
      setTimeout(() => setHashCopied(false), 2000)
    }
  }

  // Load previous attempts to check retry eligibility
  useEffect(() => {
    if (quiz?.id && userId) {
      fetch(`/api/org/${orgSlug}/quizzes/${quiz.id}/attempts?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.attempts && data.attempts.length > 0) {
            const latestAttempt = data.attempts[0]
            setScore(latestAttempt.score)
            setPassed(latestAttempt.passed)
            setSubmitted(true)
            setShowExplanations(quiz.showAnswersAfter)
            
            // Check if retry is allowed
            if (quiz.allowRetry && !latestAttempt.passed) {
              setCanRetry(true)
            }
          }
        })
        .catch(console.error)
    }
  }, [quiz?.id, userId, orgSlug, quiz?.allowRetry, quiz?.showAnswersAfter])

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return <div>Quiz not found</div>
  }

  const questions = quiz.questions
  const currentQuestion = questions[currentQuestionIndex]
  const isFirst = currentQuestionIndex === 0
  const isLast = currentQuestionIndex === questions.length - 1
  const allAnswered = questions.every((q: any) => answers[q.id])

  const handleAnswerChange = (questionId: string, choiceId: string) => {
    if (submitted && !canRetry) return
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }))
  }

  const handleSubmit = async () => {
    if (!allAnswered) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/org/${orgSlug}/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          enrollmentId,
          userId,
        }),
      })

      const data = await response.json()
      setScore(data.score)
      setPassed(data.passed)
      setAttemptId(data.attemptId)
      setSubmitted(true)
      setShowExplanations(quiz.showAnswersAfter)
      setCanRetry(quiz.allowRetry && !data.passed)
      setViewMode("summary")

      if (data.passed) {
        onComplete()
      }
    } catch (error) {
      console.error("Error submitting quiz:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(null)
    setPassed(null)
    setAttemptId(null)
    setShowExplanations(false)
    setCanRetry(false)
    setCurrentQuestionIndex(0)
  }

  const handleNext = () => {
    if (!isLast) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const getQuestionStatus = (question: any) => {
    if (!submitted) return null
    const userAnswer = answers[question.id]
    const correctChoice = question.choices.find((c: any) => c.isCorrect)
    return userAnswer === correctChoice?.id ? "correct" : "incorrect"
  }

  const currentStatus = getQuestionStatus(currentQuestion)

  // Results summary view (after submit)
  if (submitted && viewMode === "summary") {
    const total = quiz?.questions?.length ?? 0
    const correctCount = total - wrongQuestions.length
    return (
      <div className="flex min-h-0 flex-col gap-4">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Quiz Results</h2>
            <Button variant="outline" size="sm" onClick={() => setViewMode("questions")}>
              Review answers
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6" />
                Score: {score ?? 0}% — {passed ? "Passed" : "Did not pass"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You got {correctCount} of {total} questions correct.
              </p>
            </CardContent>
          </Card>

          {wrongQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Questions you missed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {wrongQuestions.map((q: any) => {
                  const userChoiceId = answers[q.id]
                  const userChoice = q.choices.find((c: any) => c.id === userChoiceId)
                  const correctChoice = q.choices.find((c: any) => c.isCorrect)
                  return (
                    <div key={q.id} className="rounded-lg border p-4 space-y-2">
                      <p className="font-medium">{q.text}</p>
                      <p className="text-sm text-red-400">
                        Your answer: {userChoice?.text ?? "—"}
                      </p>
                      <p className="text-sm text-green-400">
                        Correct answer: {correctChoice?.text ?? "—"}
                      </p>
                      {q.explanation && (
                        <p className="text-sm text-muted-foreground pt-2 border-t">
                          <strong>Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Certificate verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use the hashed certificate below to verify this attempt. Copy and submit it where required.
              </p>
              {verificationHash && (
                <div className="flex flex-wrap items-center gap-2">
                  <code className="flex-1 min-w-0 text-xs bg-muted px-2 py-2 rounded break-all font-mono">
                    {hashHex ?? "Computing hash…"}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyHash}>
                    <Copy className="h-4 w-4 mr-2" />
                    {hashCopied ? "Copied!" : "Copy hash"}
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Your certificate will be available after you complete all required steps.{" "}
                <Link
                  href={`/org/${orgSlug}/certificates`}
                  className="text-primary underline"
                >
                  View certificates
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between border-t border-border bg-background/95 py-3">
          {canRetry && (
            <Button variant="outline" onClick={handleRetry}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Quiz
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => setViewMode("questions")}>
            Review answers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      {/* Scrollable content */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
      {/* Progress and Score Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        {submitted && score !== null && (
          <div className={`text-lg font-semibold ${passed ? "text-green-400" : "text-red-400"}`}>
            Score: {score}% {passed ? "✓ Passed" : "✗ Failed"}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-6">
        <div
          className={`h-2 rounded-full transition-all ${
            submitted && passed ? "bg-green-500" : submitted ? "bg-red-500" : "bg-primary"
          }`}
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {currentQuestion.text}
          </CardTitle>
          {submitted && showExplanations && currentQuestion.explanation && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestion.choices.map((choice: any) => {
              const isSelected = answers[currentQuestion.id] === choice.id
              const isCorrect = choice.isCorrect
              const showResult = submitted && showExplanations
              const showCorrect = showResult && isCorrect
              const showIncorrect = showResult && isSelected && !isCorrect

              return (
                <label
                  key={choice.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-muted-foreground/40 text-foreground"
                  } ${
                    showCorrect
                      ? "!border-green-500 !bg-green-900/60 text-green-50"
                      : showIncorrect
                      ? "!border-red-500 !bg-red-900/60 text-red-50"
                      : ""
                  } ${submitted && !canRetry ? "cursor-not-allowed opacity-75" : ""}`}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={choice.id}
                    checked={isSelected}
                    onChange={() => handleAnswerChange(currentQuestion.id, choice.id)}
                    disabled={submitted && !canRetry}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="flex-1">{choice.text}</span>
                  {showCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-300 flex-shrink-0" />
                  )}
                  {showIncorrect && (
                    <XCircle className="h-5 w-5 text-red-300 flex-shrink-0" />
                  )}
                </label>
              )
            })}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Navigation and Actions - sticky so visible at 100% zoom on small viewports */}
      <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between border-t border-border bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirst}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {!submitted ? (
            <>
              {isLast ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitting}
                >
                  {submitting ? "Submitting..." : "Submit Quiz"}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!answers[currentQuestion.id]}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </>
          ) : (
            <>
              {canRetry && (
                <Button onClick={handleRetry} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Quiz
                </Button>
              )}
              {isLast ? (
                <div className="flex items-center gap-2">
                  {passed ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Quiz Passed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">
                        Quiz Failed {quiz.allowRetry ? "- You can retry" : ""}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Question Navigation Dots */}
      {questions.length > 1 && (
        <div className="flex shrink-0 justify-center gap-2 pt-2">
          {questions.map((q: any, index: number) => {
            const hasAnswer = !!answers[q.id]
            const isCurrent = index === currentQuestionIndex
            const status = getQuestionStatus(q)

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ring-offset-background ${
                  isCurrent
                    ? "bg-primary ring-2 ring-primary ring-offset-2"
                    : hasAnswer
                    ? "bg-muted-foreground/50"
                    : "bg-muted"
                } ${
                  status === "correct"
                    ? "!bg-green-500"
                    : status === "incorrect"
                    ? "!bg-red-500"
                    : ""
                }`}
                title={`Question ${index + 1}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
