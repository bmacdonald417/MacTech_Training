"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { setUserGroup } from "./actions"
import { Input } from "@/components/ui/input"
import { ChevronDown, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface GroupOption {
  id: string
  name: string
}

interface UserGroupSelectProps {
  orgSlug: string
  userId: string
  groups: GroupOption[]
  currentGroupId: string | null
  currentGroupName: string | null
}

export function UserGroupSelect({
  orgSlug,
  userId,
  groups,
  currentGroupId,
  currentGroupName,
}: UserGroupSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [pending, setPending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g) => g.name.toLowerCase().includes(q))
  }, [groups, query])

  useEffect(() => {
    if (open) {
      setQuery("")
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  async function handleSelect(groupId: string | null) {
    setPending(true)
    await setUserGroup(orgSlug, userId, groupId)
    setPending(false)
    setOpen(false)
  }

  const displayLabel = currentGroupName ?? "No group"

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          disabled={pending}
          className={cn(
            "flex min-w-[10rem] max-w-[14rem] items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-left text-sm text-foreground transition-colors",
            "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Select group"
        >
          <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{displayLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "z-50 min-w-[14rem] rounded-xl border border-border/60 bg-card p-0 shadow-lg",
            "transition-opacity duration-150"
          )}
          sideOffset={4}
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-2 border-b border-border/40">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search groups…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className="h-9 text-sm"
            />
          </div>
          <div className="max-h-[12rem] overflow-y-auto p-1">
            <DropdownMenu.Item
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none transition-colors",
                "hover:bg-muted focus:bg-muted focus:outline-none",
                !currentGroupId && "bg-muted/60"
              )}
              onSelect={() => handleSelect(null)}
            >
              <span className="text-muted-foreground">No group</span>
            </DropdownMenu.Item>
            {filtered.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No groups match
              </div>
            )}
            {filtered.map((g) => (
              <DropdownMenu.Item
                key={g.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground outline-none transition-colors",
                  "hover:bg-muted focus:bg-muted focus:outline-none",
                  currentGroupId === g.id && "bg-muted/60"
                )}
                onSelect={() => handleSelect(g.id)}
              >
                {g.name}
              </DropdownMenu.Item>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
