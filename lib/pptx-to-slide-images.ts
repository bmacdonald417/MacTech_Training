/**
 * Server-side PPTX → PNG conversion for slide images (fallback when pptx-preview reports 0 slides).
 * Uses LibreOffice to convert PPTX → PDF, then pdftoppm (poppler-utils) to get one PNG per page.
 */

import fs from "fs"
import path from "path"
import os from "os"
import { spawnSync } from "child_process"
import { getMountPath } from "./narration-storage"
import { ensureDirForFile, isMountWritable } from "./narration-storage"

const SLIDE_IMAGES_DIR = "slide-images"

/** Absolute path to the directory for a file's slide images: {mount}/slide-images/{fileId}/ */
export function getSlideImageDir(fileId: string): string {
  return path.join(getMountPath(), SLIDE_IMAGES_DIR, fileId)
}

/** Absolute path to the PNG for slide index (0-based). File name is {index + 1}.png */
export function getSlideImagePath(fileId: string, index: number): string {
  return path.join(getSlideImageDir(fileId), `${index + 1}.png`)
}

/** Check if a slide image exists on disk. */
export async function slideImageExists(fileId: string, index: number): Promise<boolean> {
  const p = getSlideImagePath(fileId, index)
  try {
    await fs.promises.access(p, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

/** Get count of existing slide images for a file (by counting 1.png, 2.png, ...). */
export async function getExistingSlideImageCount(fileId: string): Promise<number> {
  const dir = getSlideImageDir(fileId)
  try {
    const names = await fs.promises.readdir(dir)
    const nums = names
      .filter((n) => /^\d+\.png$/i.test(n))
      .map((n) => parseInt(n.replace(/\D/g, ""), 10))
    if (nums.length === 0) return 0
    return Math.max(...nums)
  } catch {
    return 0
  }
}

const LIBREOFFICE_BIN = process.env.LIBREOFFICE_PATH ?? "libreoffice"
const PDFTOPPM_BIN = process.env.PDFTOPPM_PATH ?? "pdftoppm"

/**
 * Generate PNG images for each slide: PPTX → PDF (LibreOffice) → PNG per page (pdftoppm).
 * Writes slide-images/{fileId}/1.png, 2.png, ...
 * Returns the number of slides generated, or an error object if conversion fails.
 */
export async function generateSlideImages(
  fileId: string,
  buffer: Buffer
): Promise<{ count: number } | { error: string }> {
  const writable = await isMountWritable()
  if (!writable) {
    return { error: "Storage path is not writable. Set RAILWAY_VOLUME_MOUNT_PATH." }
  }

  const tmpDir = path.join(os.tmpdir(), `pptx-slides-${fileId}-${Date.now()}`)
  const inputPath = path.join(tmpDir, "deck.pptx")
  const pdfPath = path.join(tmpDir, "deck.pdf")
  const ppmPrefix = path.join(tmpDir, "slide")

  try {
    await fs.promises.mkdir(tmpDir, { recursive: true })
    await fs.promises.writeFile(inputPath, buffer, "binary")

    const lo = spawnSync(
      LIBREOFFICE_BIN,
      ["--headless", "--convert-to", "pdf", "--outdir", tmpDir, inputPath],
      { encoding: "utf8", timeout: 120_000 }
    )
    if (lo.error) {
      const msg = lo.error.message ?? String(lo.error)
      if (msg.includes("ENOENT")) {
        return {
          error: `LibreOffice not found (${LIBREOFFICE_BIN}). Install LibreOffice or set LIBREOFFICE_PATH.`,
        }
      }
      return { error: `LibreOffice failed: ${msg}` }
    }
    if (lo.status !== 0) {
      return { error: `LibreOffice exited ${lo.status}. ${lo.stderr?.trim() ?? ""}` }
    }

    try {
      await fs.promises.access(pdfPath, fs.constants.R_OK)
    } catch {
      return { error: "LibreOffice did not produce a PDF." }
    }

    const pdftoppm = spawnSync(
      PDFTOPPM_BIN,
      ["-png", "-r", "150", pdfPath, ppmPrefix],
      { encoding: "utf8", timeout: 120_000 }
    )
    if (pdftoppm.error) {
      const msg = pdftoppm.error.message ?? String(pdftoppm.error)
      if (msg.includes("ENOENT")) {
        return {
          error: `pdftoppm not found (${PDFTOPPM_BIN}). Install poppler-utils or set PDFTOPPM_PATH.`,
        }
      }
      return { error: `pdftoppm failed: ${msg}` }
    }
    if (pdftoppm.status !== 0) {
      return { error: `pdftoppm exited ${pdftoppm.status}. ${pdftoppm.stderr?.trim() ?? ""}` }
    }

    const outFiles = await fs.promises.readdir(tmpDir)
    const pngs = outFiles.filter((n) => n.toLowerCase().endsWith(".png"))
    if (pngs.length === 0) {
      return { error: "pdftoppm produced no PNG files." }
    }

    // pdftoppm outputs slide-1.png, slide-2.png, ... Sort by number.
    const byNum = pngs
      .map((n) => {
        const m = n.match(/-(\d+)\.png$/i)
        const v = m ? parseInt(m[1], 10) : NaN
        return { name: n, index: Number.isNaN(v) ? 0 : v }
      })
      .sort((a, b) => a.index - b.index)

    const destDir = getSlideImageDir(fileId)
    await ensureDirForFile(path.join(destDir, "1.png"))

    for (let i = 0; i < byNum.length; i++) {
      const src = path.join(tmpDir, byNum[i].name)
      const dest = path.join(destDir, `${i + 1}.png`)
      await fs.promises.copyFile(src, dest)
    }

    return { count: byNum.length }
  } finally {
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true })
    } catch {
      // ignore cleanup errors
    }
  }
}
