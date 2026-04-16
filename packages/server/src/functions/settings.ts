import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '../api-client'

type UpdateSettingParams = {
  key: string
  value: unknown
}

export const listSettingsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const api = createServerApi(request)

  const result = await api.api.v1.settings.get()
  const data = unwrap(result, 'Failed to list settings')
  return data.data
})

export const updateSettingFn = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateSettingParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.settings.patch({ key: data.key, value: data.value })
    const res = unwrap(result, 'Failed to update setting')
    return res.data
  })
