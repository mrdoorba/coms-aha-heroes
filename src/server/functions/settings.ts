import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

type UpdateSettingParams = {
  key: string
  value: unknown
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

export const listSettingsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest()
  const response = await fetch(`${getBaseUrl(request)}/api/v1/settings`, {
    headers: { Cookie: request.headers.get('cookie') ?? '' },
  })

  const result = await response.json()
  if (!response.ok) throw new Error(result.error?.message ?? 'Failed to list settings')
  return result.data
})

export const updateSettingFn = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateSettingParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(`${getBaseUrl(request)}/api/v1/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({ key: data.key, value: data.value }),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to update setting')
    return result.data
  })
