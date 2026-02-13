import { readFile } from "fs/promises"
import path from "path"

export interface ResourceMeta {
  id: string
  title: string
  description: string
  /** Path relative to project root (e.g. components/resources/...) */
  filePath: string
}

export const RESOURCES: ResourceMeta[] = [
  {
    id: "c3pao-interrogation-guide",
    title: "C3PAO Interrogation Guide",
    description:
      "CMMC 2.0 Level 2 assessment guide: what C3PAOs look for (Interview, Examine, Test) across NIST SP 800-171 domains.",
    filePath: "components/resources/C3PAO_Interrogation_Guide_by_MacTech.md",
  },
]

export function getResourceById(id: string): ResourceMeta | undefined {
  return RESOURCES.find((r) => r.id === id)
}

/**
 * Reads resource markdown from the filesystem. Use in server components only.
 */
export async function getResourceContent(id: string): Promise<string | null> {
  const resource = getResourceById(id)
  if (!resource) return null
  try {
    const fullPath = path.join(process.cwd(), resource.filePath)
    return await readFile(fullPath, "utf-8")
  } catch {
    return null
  }
}
