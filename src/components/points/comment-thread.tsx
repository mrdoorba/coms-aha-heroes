import * as React from 'react'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { useSession } from '~/lib/auth-client'
import { listCommentsFn, createCommentFn } from '~/server/functions/comments'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Send, User as UserIcon } from 'lucide-react'

interface CommentThreadProps {
  entityId: string
  entityType: 'achievement' | 'challenge' | 'appeal'
}

export function CommentThread({ entityId, entityType }: CommentThreadProps) {
  const { data: session } = useSession()
  const [body, setBody] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const router = useRouter()

  const { data } = useSuspenseQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => listCommentsFn({ data: { entityType, entityId } }),
  })

  const comments = data?.comments ?? []

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await createCommentFn({ data: { entityType, entityId, body } })
      setBody('')
      router.invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <h3 className="text-sm font-semibold text-[#1D388B] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#325FEC]" />
        Comments ({comments.length})
      </h3>

      <div className="space-y-5">
        {comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Start the conversation!</p>
        ) : (
          comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                {comment.user?.avatarUrl ? (
                  <img src={comment.user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D388B]">{comment.user?.name ?? 'Unknown'}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="text-sm text-foreground leading-relaxed">
                  {comment.body}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={onSubmit} className="relative mt-4">
        <Textarea
          placeholder="Write a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="pr-12 min-h-[100px] rounded-2xl bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-[#325FEC] transition-all"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!body.trim() || isSubmitting}
          className="absolute right-2 bottom-2 h-8 w-8 rounded-xl bg-[#325FEC] hover:bg-blue-700 shadow-md shadow-blue-100"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
