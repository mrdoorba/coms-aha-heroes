import { randomUUID } from 'crypto'
import { mkdir, writeFile, access } from 'fs/promises'
import { join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type SignedUploadResult = {
  readonly uploadUrl: string
  readonly fileKey: string
  readonly publicUrl: string
}

/**
 * Generates a unique file key and returns URLs for upload.
 * In production, this would generate GCS signed URLs.
 * In dev, files are stored locally in /uploads.
 */
export async function generateUploadUrl(
  contentType: string,
  originalName: string,
): Promise<SignedUploadResult> {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new InvalidFileTypeError(contentType)
  }

  const ext = originalName.split('.').pop() ?? 'jpg'
  const fileKey = `${Date.now()}-${randomUUID()}.${ext}`

  await ensureUploadDir()

  return {
    uploadUrl: `/api/v1/uploads/${fileKey}`,
    fileKey,
    publicUrl: `/api/v1/uploads/${fileKey}`,
  }
}

/**
 * Stores uploaded file data to local filesystem.
 * In production, uploads go directly to GCS via signed URL.
 */
export async function storeFile(
  fileKey: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new InvalidFileTypeError(contentType)
  }

  if (data.length > MAX_FILE_SIZE) {
    throw new FileTooLargeError(data.length)
  }

  await ensureUploadDir()
  const filePath = join(UPLOAD_DIR, fileKey)
  await writeFile(filePath, data)

  return `/api/v1/uploads/${fileKey}`
}

export function getFilePath(fileKey: string): string {
  return join(UPLOAD_DIR, fileKey)
}

async function ensureUploadDir(): Promise<void> {
  try {
    await access(UPLOAD_DIR)
  } catch {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// Domain errors
export class InvalidFileTypeError extends Error {
  constructor(type: string) {
    super(`Invalid file type: ${type}. Allowed: ${ALLOWED_TYPES.join(', ')}`)
    this.name = 'InvalidFileTypeError'
  }
}

export class FileTooLargeError extends Error {
  constructor(size: number) {
    super(`File too large: ${(size / 1024 / 1024).toFixed(1)}MB. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    this.name = 'FileTooLargeError'
  }
}
