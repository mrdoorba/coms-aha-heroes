import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

type CreateCommentParams = {
  entityType: string
  entityId: string
  body: string
}

type UpdateCommentParams = {
  commentId: string
  body: string
}

type ListCommentsParams = {
  entityType: string
  entityId: string
  page?: number
  limit?: number
}

export const listCommentsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListCommentsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const params = new URLSearchParams()
    params.set('entityType', data.entityType)
    params.set('entityId', data.entityId)
    params.set('page', String(data.page ?? 1))
    params.set('limit', String(data.limit ?? 20))

    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/comments?${params.toString()}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to list comments')
    return { comments: result.data, meta: result.meta }
  })

export const createCommentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateCommentParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(`${getBaseUrl(request)}/api/v1/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to create comment')
    return result.data
  })

export const updateCommentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateCommentParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/comments/${data.commentId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({ body: data.body }),
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to update comment')
    return result.data
  })

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}
