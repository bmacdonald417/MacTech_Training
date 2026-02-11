import fs from "fs"
import path from "path"
import { createReadStream } from "fs"
import type { ReadStream } from "fs"
import { getMountPath, ensureDirForFile, isMountWritable } from "./narration-storage"

const STORED_FILES_DIR = "stored-files"

/** Resolve stored file storagePath (from DB) to absolute filesystem path. */
export function resolveStoredFileAbsolutePath(storagePath: string): string {
  const base = getMountPath()
  return path.isAbsolute(storagePath) ? storagePath : path.join(base, storagePath)
}

/** Create a read stream for a stored file. Caller must handle file-not-found. */
export function createStoredFileReadStream(storagePath: string): ReadStream {
  return createReadStream(resolveStoredFileAbsolutePath(storagePath))
}

/**
 * Full filesystem path for a stored file.
 * Pattern: {mount}/stored-files/{orgId}/{fileId}{ext}
 */
export function getStoredFilePath(
  orgId: string,
  fileId: string,
  filename: string
): string {
  const base = getMountPath()
  const ext = path.extname(filename) || path.extname(fileId)
  const name = path.basename(fileId, path.extname(fileId)) + ext
  return path.join(base, STORED_FILES_DIR, orgId, name)
}

/**
 * Relative path for DB storage.
 */
export function getStoredFileRelativePath(
  orgId: string,
  fileId: string,
  filename: string
): string {
  const ext = path.extname(filename) || path.extname(fileId)
  const name = path.basename(fileId, path.extname(fileId)) + ext
  return path.join(STORED_FILES_DIR, orgId, name)
}

export async function writeStoredFile(
  orgId: string,
  fileId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const writable = await isMountWritable()
  if (!writable) {
    throw new Error(
      `Storage path is not writable: ${getMountPath()}. Set RAILWAY_VOLUME_MOUNT_PATH to a writable directory.`
    )
  }
  const filePath = getStoredFilePath(orgId, fileId, filename)
  await ensureDirForFile(filePath)
  await fs.promises.writeFile(filePath, buffer, "binary")
  return getStoredFileRelativePath(orgId, fileId, filename)
}
