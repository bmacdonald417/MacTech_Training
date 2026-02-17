/**
 * Clear Railway volume storage: wipe slide-image cache and remove orphaned files.
 * Use from admin API only. Frees disk space when GUI deletes don't remove files.
 */

import fs from "fs"
import path from "path"
import { getMountPath } from "./narration-storage"
import { resolveStoredFileAbsolutePath } from "./stored-file-storage"
import { resolveAbsolutePath } from "./narration-storage"
import { prisma } from "./prisma"

const SLIDE_IMAGES_DIR = "slide-images"
const STORED_FILES_DIR = "stored-files"
const NARRATION_DIR = "narration"

/** Recursively list all file paths under dir (absolute). */
async function listFilesRecursive(dir: string): Promise<string[]> {
  const out: string[] = []
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        out.push(...(await listFilesRecursive(full)))
      } else {
        out.push(full)
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
  }
  return out
}

export type StorageCleanupResult = {
  ok: true
  slideImagesWiped: boolean
  slideImagesError?: string
  orphanedStoredDeleted: number
  orphanedStoredErrors: string[]
  orphanedNarrationDeleted: number
  orphanedNarrationErrors: string[]
}

export async function runStorageCleanup(): Promise<StorageCleanupResult> {
  const base = getMountPath()
  const result: StorageCleanupResult = {
    ok: true,
    slideImagesWiped: false,
    orphanedStoredDeleted: 0,
    orphanedStoredErrors: [],
    orphanedNarrationDeleted: 0,
    orphanedNarrationErrors: [],
  }

  // 1. Wipe entire slide-images directory (regenerated on demand)
  const slideImagesPath = path.join(base, SLIDE_IMAGES_DIR)
  try {
    await fs.promises.rm(slideImagesPath, { recursive: true, force: true })
    result.slideImagesWiped = true
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      result.slideImagesError = msg
    } else {
      result.slideImagesWiped = true // dir didn't exist, consider it wiped
    }
  }

  // 2. Orphaned stored-files: delete files on disk that are no longer in StoredFile table
  const storedFiles = await prisma.storedFile.findMany({
    where: { storagePath: { not: "db" } },
    select: { storagePath: true },
  })
  const keptStored = new Set(
    storedFiles.map((f) => path.normalize(resolveStoredFileAbsolutePath(f.storagePath)))
  )
  const storedDir = path.join(base, STORED_FILES_DIR)
  const storedOnDisk = await listFilesRecursive(storedDir)
  for (const filePath of storedOnDisk) {
    const normalized = path.normalize(filePath)
    if (keptStored.has(normalized)) continue
    try {
      await fs.promises.unlink(filePath)
      result.orphanedStoredDeleted++
    } catch (err) {
      result.orphanedStoredErrors.push(
        `${filePath}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  // 3. Orphaned narration: delete files on disk that are no longer in NarrationAsset table
  const narrationAssets = await prisma.narrationAsset.findMany({
    select: { storagePath: true },
  })
  const keptNarration = new Set(
    narrationAssets.map((a) => path.normalize(resolveAbsolutePath(a.storagePath)))
  )
  const narrationBase = path.join(base, NARRATION_DIR)
  const narrationOnDisk = await listFilesRecursive(narrationBase)
  for (const filePath of narrationOnDisk) {
    const normalized = path.normalize(filePath)
    if (keptNarration.has(normalized)) continue
    try {
      await fs.promises.unlink(filePath)
      result.orphanedNarrationDeleted++
    } catch (err) {
      result.orphanedNarrationErrors.push(
        `${filePath}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  return result
}
