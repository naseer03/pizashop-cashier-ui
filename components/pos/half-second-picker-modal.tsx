'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { menuItemHasHalfSize } from '@/lib/half-and-half'
import { isHalfMenuSize } from '@/lib/pos-data'
import type { CartItem, MenuItem } from '@/lib/pos-data'

interface HalfSecondPickerModalProps {
  open: boolean
  firstHalf: CartItem
  menuItems: MenuItem[]
  onSelect: (item: MenuItem) => void
  onCancel: () => void
}

export function HalfSecondPickerModal({
  open,
  firstHalf,
  menuItems,
  onSelect,
  onCancel,
}: HalfSecondPickerModalProps) {
  const candidates = menuItems.filter(
    (item) => item.id !== firstHalf.id && menuItemHasHalfSize(item),
  )

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="flex max-h-[90vh] min-h-0 flex-col sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>Choose second half</DialogTitle>
          <DialogDescription>
            First half: <span className="font-medium text-foreground">{firstHalf.name}</span>. Pick a
            different item for the other half.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 pr-2">
          {candidates.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No other menu items with half size are available.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 p-1 sm:grid-cols-2">
              {candidates.map((item) => {
                const halfPrice =
                  item.sizes?.find((option) => isHalfMenuSize(option.size))?.price ?? item.price
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3 text-left transition-colors hover:border-primary hover:bg-secondary"
                  >
                    <span className="text-2xl">{item.image}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        Half ${halfPrice.toFixed(2)}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
