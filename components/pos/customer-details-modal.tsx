'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CustomerDetailsPanel } from '@/components/pos/customer-details-panel'
import { isCustomerFormValid, type CustomerFormState, type OrderType } from '@/lib/pos-data'

export type CustomerModalIntent = 'start-order' | 'checkout' | 'kot'

interface CustomerDetailsModalProps {
  open: boolean
  orderType: OrderType
  value: CustomerFormState
  onChange: (value: CustomerFormState) => void
  intent: CustomerModalIntent
  onConfirm: () => void
  onClose: () => void
}

const intentCopy: Record<
  CustomerModalIntent,
  { title: string; description: string; confirm: string }
> = {
  'start-order': {
    title: 'Start order',
    description: 'Enter customer details before adding menu items to the cart.',
    confirm: 'Continue',
  },
  checkout: {
    title: 'Customer details',
    description: 'Enter customer information before payment.',
    confirm: 'Continue to payment',
  },
  kot: {
    title: 'Customer details',
    description: 'Enter customer information before printing the kitchen ticket.',
    confirm: 'Print KOT',
  },
}

export function CustomerDetailsModal({
  open,
  orderType,
  value,
  onChange,
  intent,
  onConfirm,
  onClose,
}: CustomerDetailsModalProps) {
  const copy = intentCopy[intent]
  const canConfirm = isCustomerFormValid(value, orderType)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex max-h-[90vh] min-h-0 flex-col sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          <CustomerDetailsPanel orderType={orderType} value={value} onChange={onChange} />
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="w-full sm:w-auto"
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
