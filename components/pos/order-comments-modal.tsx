'use client'

import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface OrderCommentsModalProps {
  open: boolean
  onClose: () => void
  value: string
  onSave: (comments: string) => void
}

export function OrderCommentsModal({
  open,
  onClose,
  value,
  onSave,
}: OrderCommentsModalProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (open) {
      setDraft(value)
    }
  }, [open, value])

  const handleSave = () => {
    onSave(draft.trim())
    onClose()
  }

  const handleClear = () => {
    setDraft('')
    onSave('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] min-h-0 flex-col sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />
            Order Comments
          </DialogTitle>
          <DialogDescription>
            Notes for the kitchen or staff. Sent with the order when you checkout or print KOT.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 py-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Extra napkins, allergy note, rush order…"
            className="min-h-[120px] resize-y bg-background text-sm"
            maxLength={500}
          />
          <p className="mt-2 text-xs text-muted-foreground">{draft.length}/500</p>
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:gap-2">
          {value.trim().length > 0 && (
            <Button type="button" variant="ghost" onClick={handleClear}>
              Clear
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
