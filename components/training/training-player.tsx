"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { ContentViewer } from "./content-viewer"
import { useRouter } from "next/navigation"

interface TrainingPlayerProps {
  enrollment: any
  orgSlug: string
  userId: string
  canGenerateNarration?: boolean
}

export function TrainingPlayer({
  enrollment,
  orgSlug,
  userId,
  canGenerateNarration = false,
}: TrainingPlayerProps) {
  const router = useRouter()
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Build navigation items
  const navigationItems: any[] = []

  if (enrollment.assignment.type === "CONTENT_ITEM") {
    navigationItems.push({
      id: enrollment.assignment.contentItem.id,
      title: enrollment.assignment.title,
      type: enrollment.assignment.contentItem.type,
      contentItem: enrollment.assignment.contentItem,
    })
  } else {
    // Curriculum
    enrollment.assignment.curriculum?.sections.forEach((section: any) => {
      section.items.forEach((item: any) => {
        navigationItems.push({
          id: item.contentItem.id,
          title: item.contentItem.title,
          type: item.contentItem.type,
          required: item.required,
          contentItem: item.contentItem,
          sectionTitle: section.title,
        })
      })
    })
  }

  // Load completed items
  useEffect(() => {
    const completed = new Set<string>(
      enrollment.itemProgress
        .filter((p: any) => p.completed)
        .map((p: any) => p.contentItemId as string)
    )
    setCompletedItems(completed)
  }, [enrollment.itemProgress])

  const currentItem = navigationItems[currentItemIndex]
  const isFirst = currentItemIndex === 0
  const isLast = currentItemIndex === navigationItems.length - 1

  const handleItemComplete = async (itemId: string) => {
    if (completedItems.has(itemId)) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/org/${orgSlug}/training/${enrollment.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentItemId: itemId }),
        }
      )

      if (response.ok) {
        const data = await response.json().catch(() => ({}))
        setCompletedItems((prev) => new Set(Array.from(prev).concat(itemId)))
        
        // If training just completed and we have a certificate, show it
        const allCompleted = navigationItems.every((item) =>
          itemId === item.id ? true : completedItems.has(item.id)
        )
        if (allCompleted && isLast) {
          if (data.certificateId) {
            router.push(`/org/${orgSlug}/certificates/${data.certificateId}`)
          } else {
            router.push(`/org/${orgSlug}/my-training`)
          }
          router.refresh()
        }
      }
    } catch (error) {
      console.error("Error completing item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    if (!isLast) {
      setCurrentItemIndex(currentItemIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentItemIndex(currentItemIndex - 1)
    }
  }

  const allCompleted = navigationItems.every((item) =>
    completedItems.has(item.id)
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Main Content - fills viewport; no page scroll */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden min-w-0">
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-0 shadow-none">
          <CardHeader className="shrink-0 py-1">
            <CardTitle className="truncate text-sm font-medium">{currentItem?.title}</CardTitle>
          </CardHeader>
          <CardContent
            className={
              currentItem?.type === "SLIDE_DECK"
                ? "flex min-h-0 flex-1 flex-col overflow-hidden p-2 min-h-[420px]"
                : "flex min-h-0 flex-1 flex-col overflow-hidden p-2"
            }
          >
            {currentItem?.type === "QUIZ" && (
              <div className="mb-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">
                  Assessment: 20-question knowledge check
                </p>
                <p className="mt-1 text-muted-foreground">
                  Complete the quiz below. You must pass at 80% to complete this training and receive your certificate.
                </p>
              </div>
            )}
            {currentItem && (
              <ContentViewer
                contentItem={currentItem.contentItem}
                onComplete={() => handleItemComplete(currentItem.id)}
                isCompleted={completedItems.has(currentItem.id)}
                isSubmitting={isSubmitting}
                enrollmentId={enrollment.id}
                orgSlug={orgSlug}
                userId={userId}
                canGenerateNarration={canGenerateNarration}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex shrink-0 items-center justify-between gap-2 py-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={isFirst}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-gray-600">
            {currentItemIndex + 1} of {navigationItems.length}
          </div>

          {isLast && allCompleted ? (
            <Button
              size="sm"
              onClick={() => router.push(`/org/${orgSlug}/my-training`)}
            >
              Finish Training
            </Button>
          ) : (
            <Button size="sm" onClick={handleNext} disabled={isLast}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
