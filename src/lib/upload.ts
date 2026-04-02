/**
 * Uploads a file to the server and returns the stored URL.
 * Call this at form-submit time so files are only stored when actually needed.
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file, file.name)

  const response = await fetch('/api/v1/uploads', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message ?? 'Upload failed')
  }

  return result.data.url as string
}
