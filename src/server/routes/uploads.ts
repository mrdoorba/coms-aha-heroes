import { Elysia, t } from 'elysia'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { Readable } from 'stream'
import * as storage from '../services/storage'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'

type Ctx = { authUser: AuthUser; tx: DbClient }

export const uploadsRoute = new Elysia({ prefix: '/uploads' })

  // POST /uploads — upload a file (multipart/form-data)
  .post('/', async ({ body, set }) => {
    const file = body.file

    if (!file) {
      set.status = 400
      return { success: false, data: null, error: { code: 'BAD_REQUEST', message: 'No file provided' } }
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const url = await storage.storeFile(file.name, buffer, file.type)

      set.status = 201
      return {
        success: true,
        data: { url, fileKey: file.name },
        error: null,
      }
    } catch (err) {
      if (err instanceof storage.InvalidFileTypeError) {
        set.status = 422
        return { success: false, data: null, error: { code: 'INVALID_FILE_TYPE', message: err.message } }
      }
      if (err instanceof storage.FileTooLargeError) {
        set.status = 413
        return { success: false, data: null, error: { code: 'FILE_TOO_LARGE', message: err.message } }
      }
      throw err
    }
  }, {
    body: t.Object({
      file: t.File(),
    }),
  })

  // GET /uploads/:fileKey — serve uploaded file
  .get('/:fileKey', async ({ params, set }) => {
    const filePath = storage.getFilePath(params.fileKey)

    try {
      const stats = await stat(filePath)
      if (!stats.isFile()) {
        set.status = 404
        return { success: false, data: null, error: { code: 'NOT_FOUND', message: 'File not found' } }
      }

      const ext = params.fileKey.split('.').pop()?.toLowerCase()
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
      set.status = 404
      return { success: false, data: null, error: { code: 'NOT_FOUND', message: 'File not found' } }
    }
  })
