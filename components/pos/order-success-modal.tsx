'use client'

import { CheckCircle2, Printer, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { PaymentMethod } from '@/lib/pos-data'

interface OrderSuccessModalProps {
  open: boolean
  orderNumber: string
  total: number
  paymentMethod: PaymentMethod
  change?: number
  onClose: () => void
  onPrintReceipt: () => void
}

export function OrderSuccessModal({
  open,
  orderNumber,
  total,
  paymentMethod,
  change,
  onClose,
  onPrintReceipt,
}: OrderSuccessModalProps) {
  const paymentLabels: Record<PaymentMethod, string> = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogTitle className="sr-only">Order Complete</DialogTitle>
        <DialogDescription className="sr-only">
          Your order has been successfully placed
        </DialogDescription>
        <div className="py-6 space-y-6 text-center">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="size-20 rounded-full bg-success/20 flex items-center justify-center animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="size-10 text-success" />
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Payment Successful!</h2>
            <p className="text-muted-foreground">Order has been placed successfully</p>
          </div>

          {/* Order Details */}
          <div className="bg-secondary rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-mono font-bold text-foreground">{orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-bold text-primary">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Method</span>
              <Badge variant="outline">{paymentLabels[paymentMethod]}</Badge>
            </div>
            {paymentMethod === 'cash' && change !== undefined && change > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-muted-foreground">Change Given</span>
                <span className="font-bold text-success">${change.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Order Status */}
          <div className="flex items-center justify-center gap-2 text-accent">
            <ChefHat className="size-5" />
            <span className="font-medium">Status: Preparing</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onPrintReceipt} className="flex-1 gap-2">
              <Printer className="size-4" />
              Print Receipt
            </Button>
            <Button onClick={onClose} className="flex-1">
              New Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
