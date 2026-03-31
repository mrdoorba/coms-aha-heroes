import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '~/lib/api-client'

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
    const api = createServerApi(request)

    const result = await api.api.v1.comments.get({
      query: {
        entityType: data.entityType,
        entityId: data.entityId,
        page: data.page ?? 1,
        limit: data.limit ?? 20,
      } as any,
    })
    const res = unwrap(result, 'Failed to list comments')
    return { comments: res.data, meta: res.meta }
  })

export const createCommentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateCommentParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.comments.post(data as any)
    const res = unwrap(result, 'Failed to create comment')
    return res.data
  })

export const updateCommentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateCommentParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.comments({ id: data.commentId }).patch({ body: data.body } as any)
    const res = unwrap(result, 'Failed to update comment')
    return res.data
  })
