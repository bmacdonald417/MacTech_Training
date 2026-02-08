import fs from "fs"
import path from "path"
import { createReadStream } from "fs"
import type { ReadStream } from "fs"

const ENV_MOUNT = "RAILWAY_VOLUME_MOUNT_PATH"
const DEFAULT_MOUNT = "/data"
const FALLBACK_LOCAL = "./tmp/narration"
const NARRATION_DIR = "narration"

let _mountPath: string | null = null
let _writable: boolean | null = null

/**
 * Resolve the base path for narration storage.
 * Uses RAILWAY_VOLUME_MOUNT_PATH (default /data). If missing or not writable,
 * falls back to ./tmp/narration for local dev. Logs a warning when env is missing.
 */
export function getMountPath(): string {
  if (_mountPath !== null) return _mountPath

  const envPath = process.env[ENV_MOUNT]
  if (envPath) {
    _mountPath = path.resolve(envPath)
    return _mountPath
  }

  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(
      `[narration] ${ENV_MOUNT} is not set. Using fallback path for local dev: ${FALLBACK_LOCAL}`
    )
    _mountPath = path.resolve(FALLBACK_LOCAL)
    return _mountPath
  }

  console.warn(`[narration] ${ENV_MOUNT} is not set. Defaulting to ${DEFAULT_MOUNT}.`)
  _mountPath = path.resolve(DEFAULT_MOUNT)
  return _mountPath
}

/**
 * Returns the full filesystem path for a narration file.
 * Pattern: {mount}/narration/{orgId}/{entityType}/{entityId}.mp3
 */
export function getStoragePath(
  orgId: string,
  entityType: string,
  entityId: string
): string {
  const base = getMountPath()
  const dir = path.join(base, NARRATION_DIR, orgId, entityType)
  return path.join(dir, `${entityId}.mp3`)
}

/**
 * Relative path for DB storage (same structure, no leading slash).
 */
export function getStoragePathRelative(
  orgId: string,
  entityType: string,
  entityId: string
): string {
  return path.join(NARRATION_DIR, orgId, entityType, `${entityId}.mp3`)
}

/**
 * Ensure the directory for a file path exists. Creates parent dirs if needed.
 */
export async function ensureDirForFile(filePath: string): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.promises.mkdir(dir, { recursive: true })
}

/**
 * Check if the mount path is writable. Caches result.
 */
export async function isMountWritable(): Promise<boolean> {
  if (_writable !== null) return _writable
  const base = getMountPath()
  try {
    await fs.promises.mkdir(base, { recursive: true })
    const testFile = path.join(base, ".write-test")
    await fs.promises.writeFile(testFile, "ok")
    await fs.promises.unlink(testFile)
    _writable = true
  } catch {
    _writable = false
  }
  return _writable
}

/**
 * Write MP3 bytes to the volume path (overwrites existing).
 */
export async function writeNarrationFile(
  orgId: string,
  entityType: string,
  entityId: string,
  buffer: Buffer
): Promise<string> {
  const writable = await isMountWritable()
  if (!writable) {
    throw new Error(
      `Narration storage path is not writable: ${getMountPath()}. Set ${ENV_MOUNT} to a writable directory.`
    )
  }

  const filePath = getStoragePath(orgId, entityType, entityId)
  await ensureDirForFile(filePath)
  await fs.promises.writeFile(filePath, buffer, "binary")
  return getStoragePathRelative(orgId, entityType, entityId)
}

/**
 * Create a read stream for an existing file. Caller must handle file-not-found.
 */
export function createNarrationReadStream(
  orgId: string,
  entityType: string,
  entityId: string
): ReadStream {
  const filePath = getStoragePath(orgId, entityType, entityId)
  return createReadStream(filePath)
}

/**
 * Check if a narration file exists on disk.
 */
export async function narrationFileExists(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<boolean> {
  const filePath = getStoragePath(orgId, entityType, entityId)
  try {
    await fs.promises.access(filePath, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

/**
 * Resolve absolute path from stored relative path (for streaming).
 */
export function resolveAbsolutePath(storagePath: string): string {
  const base = getMountPath()
  return path.isAbsolute(storagePath) ? storagePath : path.join(base, storagePath)
}
