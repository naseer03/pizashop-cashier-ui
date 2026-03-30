'use client'

import { useState } from 'react'
import { CreditCard, Banknote, Smartphone, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PaymentMethod } from '@/lib/pos-data'

interface PaymentModalProps {
  open: boolean
  total: number
  onClose: () => void
  onConfirm: (method: PaymentMethod, cashReceived?: number) => void
}

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'cash', label: 'Cash', icon: <Banknote className="size-6" /> },
  { value: 'card', label: 'Card', icon: <CreditCard className="size-6" /> },
  { value: 'upi', label: 'UPI', icon: <Smartphone className="size-6" /> },
]

const quickAmounts = [10, 20, 50, 100]

export function PaymentModal({ open, total, onClose, onConfirm }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState('')

  const cashAmount = parseFloat(cashReceived) || 0
  const change = cashAmount - total

  const handleConfirm = () => {
    onConfirm(selectedMethod, selectedMethod === 'cash' ? cashAmount : undefined)
    setCashReceived('')
    setSelectedMethod('cash')
  }

  const handleQuickAmount = (amount: number) => {
    setCashReceived(amount.toString())
  }

  const isValid = selectedMethod !== 'cash' || cashAmount >= total

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Payment</DialogTitle>
          <DialogDescription className="sr-only">
            Select payment method and complete the transaction
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Total Amount */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-4xl font-bold text-primary">${total.toFixed(2)}</p>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                onClick={() => setSelectedMethod(method.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                  selectedMethod === method.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {method.icon}
                <span className="text-sm font-medium">{method.label}</span>
              </button>
            ))}
          </div>

          {/* Cash Input */}
          {selectedMethod === 'cash' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Cash Received</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-14 pl-10 pr-4 text-2xl font-bold rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-center"
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmount(amount)}
                    className="py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium text-sm transition-colors"
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Exact Amount Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCashReceived(total.toFixed(2))}
              >
                Exact Amount (${total.toFixed(2)})
              </Button>

              {/* Change Display */}
              {cashAmount > 0 && (
                <div className={`p-4 rounded-xl text-center ${
                  change >= 0 ? 'bg-success/10' : 'bg-destructive/10'
                }`}>
                  <p className="text-sm text-muted-foreground mb-1">Change</p>
                  <p className={`text-2xl font-bold ${
                    change >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    ${Math.abs(change).toFixed(2)}
                    {change < 0 && ' short'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Card/UPI Message */}
          {selectedMethod !== 'cash' && (
            <div className="p-4 rounded-xl bg-secondary text-center">
              <p className="text-muted-foreground">
                {selectedMethod === 'card' 
                  ? 'Insert or tap card on terminal' 
                  : 'Scan QR code to pay'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="flex-1 gap-2"
            disabled={!isValid}
          >
            <CheckCircle2 className="size-5" />
            Confirm Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
