"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, ChevronRight, ChevronLeft } from "lucide-react"
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
        setCompletedItems((prev) => new Set(Array.from(prev).concat(itemId)))
        
        // If all items completed, mark enrollment as completed
        const allCompleted = navigationItems.every((item) =>
          itemId === item.id ? true : completedItems.has(item.id)
        )
        
        if (allCompleted && isLast) {
          router.push(`/org/${orgSlug}/my-training`)
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

  const handleNavigation = (index: number) => {
    setCurrentItemIndex(index)
  }

  const allCompleted = navigationItems.every((item) =>
    completedItems.has(item.id)
  )

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0 overflow-y-auto border-r bg-white p-4">
        <h2 className="font-semibold mb-4">Training Outline</h2>
        <nav className="space-y-2">
          {navigationItems.map((item, index) => {
            const isCompleted = completedItems.has(item.id)
            const isCurrent = index === currentItemIndex

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(index)}
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span className="flex-1 truncate">{item.title}</span>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>{currentItem?.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
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
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
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
              onClick={() => router.push(`/org/${orgSlug}/my-training`)}
            >
              Finish Training
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={isLast}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
