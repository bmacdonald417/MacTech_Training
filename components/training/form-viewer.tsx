"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FormViewerProps {
  formTemplate: any
  enrollmentId: string
  orgSlug: string
  userId: string
  onComplete: () => void
  isCompleted: boolean
  isSubmitting: boolean
}

interface FormField {
  id: string
  type: "text" | "email" | "number" | "textarea" | "select" | "checkbox" | "radio"
  label: string
  required?: boolean
  placeholder?: string
  options?: string[] // for select/radio
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export function FormViewer({
  formTemplate,
  enrollmentId,
  orgSlug,
  userId,
  onComplete,
  isCompleted,
  isSubmitting,
}: FormViewerProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!formTemplate) {
    return <div>Form not found</div>
  }

  let fields: FormField[] = []
  try {
    const schema = JSON.parse(formTemplate.schemaJson || "[]")
    fields = Array.isArray(schema) ? schema : []
  } catch (e) {
    console.error("Error parsing form schema:", e)
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    fields.forEach((field) => {
      const value = formData[field.id]

      if (field.required && (!value || value === "")) {
        newErrors[field.id] = `${field.label} is required`
      }

      if (value && field.validation) {
        if (field.validation.min && value.length < field.validation.min) {
          newErrors[field.id] = `Minimum ${field.validation.min} characters required`
        }
        if (field.validation.max && value.length > field.validation.max) {
          newErrors[field.id] = `Maximum ${field.validation.max} characters allowed`
        }
        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field.id] = "Invalid email address"
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/org/${orgSlug}/forms/${formTemplate.id}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answersJson: formData,
            enrollmentId,
            userId,
          }),
        }
      )

      if (response.ok) {
        onComplete()
      } else {
        const data = await response.json()
        setErrors({ _general: data.error || "Failed to submit form" })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setErrors({ _general: "An error occurred. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id] || ""
    const error = errors[field.id]

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <textarea
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={`w-full px-3 py-2 border rounded-md ${
                error ? "border-red-500" : ""
              }`}
              rows={4}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <select
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className={`w-full px-3 py-2 border rounded-md ${
                error ? "border-red-500" : ""
              }`}
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case "checkbox":
        return (
          <div key={field.id} className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                id={field.id}
                checked={!!value}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                required={field.required}
                className="w-4 h-4"
              />
              <span>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case "radio":
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    required={field.required}
                    className="w-4 h-4"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {formTemplate.description && (
        <p className="text-gray-600">{formTemplate.description}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{formTemplate.contentItem?.title || "Form"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            {fields.map((field) => renderField(field))}

            {errors._general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors._general}</p>
              </div>
            )}

            {!isCompleted && (
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  type="button"
                >
                  {isSubmitting ? "Submitting..." : "Submit Form"}
                </Button>
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600 pt-4 border-t">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Form submitted successfully</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
