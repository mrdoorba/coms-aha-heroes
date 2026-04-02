import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '~/lib/utils'

type FileUploadProps = {
  readonly value?: File
  readonly onChange: (file: File | undefined) => void
  readonly required?: boolean
  readonly maxSizeMB?: number
  readonly className?: string
}

const MAX_DIMENSION = 1920

export function FileUpload({
  value,
  onChange,
  required = false,
  maxSizeMB = 10,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Generate preview from file
  useEffect(() => {
    if (!value) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const resizeImage = useCallback(
    (file: File): Promise<File> =>
      new Promise((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => {
          let { width, height } = img
          URL.revokeObjectURL(img.src)

          if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
            resolve(file)
            return
          }

          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(file)
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(new File([blob], file.name, { type: file.type }))
              else reject(new Error('Failed to resize image'))
            },
            file.type,
            0.85,
          )
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = URL.createObjectURL(file)
      }),
    [],
  )

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, PNG, WebP, and GIF are allowed')
        return
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File must be under ${maxSizeMB}MB`)
        return
      }

      try {
        const resized = await resizeImage(file)
        onChange(resized)
      } catch {
        setError('Failed to process image')
      }
    },
    [maxSizeMB, onChange, resizeImage],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (value) return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) handleFile(file)
          return
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [value, handleFile])

  const handleRemove = useCallback(() => {
    onChange(undefined)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [onChange])

  if (preview) {
    return (
      <div className={cn('relative rounded-xl border border-border overflow-hidden', className)}>
        <img
          src={preview}
          alt="Upload preview"
          className="w-full h-48 object-cover"
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelect}
        />

        {isDragging ? (
          <ImageIcon className="h-8 w-8 text-primary mb-2" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        )}
        <p className="text-sm font-medium">
          {isDragging ? 'Drop image here' : 'Click, drag, or paste image'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPEG, PNG, WebP, or GIF — max {maxSizeMB}MB
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {required && !value && (
        <p className="text-xs text-muted-foreground">* Screenshot required</p>
      )}
    </div>
  )
}
