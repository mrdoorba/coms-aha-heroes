import { Hono } from 'hono'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { Readable } from 'stream'
import * as storage from '../services/storage'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApiResponse, ApiError } from '~/shared/types/api'

type Env = {
  Variables: {
    authUser: AuthUser
    tx: DbClient
  }
}

export const uploadsRoute = new Hono<Env>()

  // POST /uploads — upload a file (multipart/form-data)
  .post('/', async (c) => {
    const body = await c.req.parseBody()
    const file = body['file']

    if (!file || !(file instanceof File)) {
      return c.json<ApiError>(
        { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'No file provided' } },
        400,
      )
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const url = await storage.storeFile(file.name, buffer, file.type)

      return c.json<ApiResponse<{ url: string; fileKey: string }>>(
        {
          success: true,
          data: { url, fileKey: file.name },
          error: null,
        },
        201,
      )
    } catch (err) {
      if (err instanceof storage.InvalidFileTypeError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'INVALID_FILE_TYPE', message: err.message } },
          422,
        )
      }
      if (err instanceof storage.FileTooLargeError) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'FILE_TOO_LARGE', message: err.message } },
          413,
        )
      }
      throw err
    }
  })

  // GET /uploads/:fileKey — serve uploaded file
  .get('/:fileKey', async (c) => {
    const fileKey = c.req.param('fileKey')
    const filePath = storage.getFilePath(fileKey)

    try {
      const stats = await stat(filePath)
      if (!stats.isFile()) {
        return c.json<ApiError>(
          { success: false, data: null, error: { code: 'NOT_FOUND', message: 'File not found' } },
          404,
        )
      }

      const ext = fileKey.split('.').pop()?.toLowerCase()
      const contentTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
      }
      const contentType = contentTypes[ext ?? ''] ?? 'application/octet-stream'

      const stream = createReadStream(filePath)
      const webStream = Readable.toWeb(stream) as ReadableStream

      return new Response(webStream, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {
      return c.json<ApiError>(
        { success: false, data: null, error: { code: 'NOT_FOUND', message: 'File not found' } },
        404,
      )
    }
  })
