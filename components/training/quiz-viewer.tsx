"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuizViewerProps {
  quiz: any
  enrollmentId: string
  orgSlug: string
  userId: string
  onComplete: () => void
  isCompleted: boolean
  isSubmitting: boolean
}

export function QuizViewer({
  quiz,
  enrollmentId,
  orgSlug,
  userId,
  onComplete,
  isCompleted,
  isSubmitting,
}: QuizViewerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [passed, setPassed] = useState<boolean | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [showExplanations, setShowExplanations] = useState(false)
  const [canRetry, setCanRetry] = useState(false)

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

  return (
    <div className="space-y-4">
      {/* Progress and Score Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        {submitted && score !== null && (
          <div className={`text-lg font-semibold ${passed ? "text-green-600" : "text-red-600"}`}>
            Score: {score}% {passed ? "✓ Passed" : "✗ Failed"}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className={`h-2 rounded-full transition-all ${
            submitted && passed ? "bg-green-600" : submitted ? "bg-red-600" : "bg-primary"
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
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
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
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  } ${
                    showCorrect
                      ? "border-green-500 bg-green-50"
                      : showIncorrect
                      ? "border-red-500 bg-red-50"
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
                    className="w-4 h-4"
                  />
                  <span className="flex-1">{choice.text}</span>
                  {showCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                  {showIncorrect && (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                </label>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation and Actions */}
      <div className="flex items-center justify-between">
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
                  disabled={!allAnswered || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Quiz"}
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
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Quiz Passed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
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
        <div className="flex justify-center gap-2 mt-4">
          {questions.map((q: any, index: number) => {
            const hasAnswer = !!answers[q.id]
            const isCurrent = index === currentQuestionIndex
            const status = getQuestionStatus(q)

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  isCurrent
                    ? "bg-primary ring-2 ring-primary ring-offset-2"
                    : hasAnswer
                    ? "bg-gray-400"
                    : "bg-gray-200"
                } ${
                  status === "correct"
                    ? "bg-green-500"
                    : status === "incorrect"
                    ? "bg-red-500"
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
