'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Banknote, Smartphone, CheckCircle2, User, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CustomerDetails, OrderType, PaymentMethod } from '@/lib/pos-data'

interface PaymentModalProps {
  open: boolean
  total: number
  orderType: OrderType
  onClose: () => void
  onConfirm: (method: PaymentMethod, customer: CustomerDetails, cashReceived?: number) => void
}

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'cash', label: 'Cash', icon: <Banknote className="size-6" /> },
  { value: 'card', label: 'Card', icon: <CreditCard className="size-6" /> },
  { value: 'upi', label: 'UPI', icon: <Smartphone className="size-6" /> },
]

const quickAmounts = [10, 20, 50, 100]

export function PaymentModal({ open, total, orderType, onClose, onConfirm }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  useEffect(() => {
    if (!open) return
    setCustomerName('')
    setCustomerPhone('')
    setDeliveryAddress('')
    setDeliveryNotes('')
    setCashReceived('')
    setSelectedMethod('cash')
  }, [open])

  const cashAmount = parseFloat(cashReceived) || 0
  const change = cashAmount - total

  const isDelivery = orderType === 'delivery'
  const customerDetailsValid =
    customerName.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    (!isDelivery || deliveryAddress.trim().length > 0)

  const handleConfirm = () => {
    if (!customerDetailsValid) return
    const customer: CustomerDetails = {
      name: customerName.trim(),
      phone: customerPhone.trim(),
      ...(isDelivery
        ? {
            address: deliveryAddress.trim(),
            ...(deliveryNotes.trim() ? { deliveryNotes: deliveryNotes.trim() } : {}),
          }
        : {}),
    }
    onConfirm(selectedMethod, customer, selectedMethod === 'cash' ? cashAmount : undefined)
  }

  const handleQuickAmount = (amount: number) => {
    setCashReceived(amount.toString())
  }

  const isValid = selectedMethod !== 'cash' || cashAmount >= total

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="flex max-h-[90vh] min-h-0 flex-col sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-center">Payment</DialogTitle>
          <DialogDescription className="sr-only">
            Enter customer details, then select payment method and complete the transaction
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-4">
          {/* Customer */}
          <div className="space-y-4 rounded-xl border border-border bg-card/50 p-4">
            <h3 className="text-sm font-semibold text-foreground">Customer</h3>
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="flex items-center gap-2">
                <User className="size-3.5 text-muted-foreground" />
                Name
              </Label>
              <Input
                id="customer-name"
                autoComplete="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full name"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone" className="flex items-center gap-2">
                <Phone className="size-3.5 text-muted-foreground" />
                Phone
              </Label>
              <Input
                id="customer-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone number"
                className="h-10"
              />
            </div>
            {isDelivery && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="delivery-address" className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    Delivery address
                  </Label>
                  <Textarea
                    id="delivery-address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street, unit, city, ZIP"
                    className="min-h-[88px] resize-y"
                    autoComplete="street-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-notes">Delivery notes (optional)</Label>
                  <Input
                    id="delivery-notes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Gate code, building name, etc."
                    className="h-10"
                  />
                </div>
              </>
            )}
          </div>

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
        <div className="flex shrink-0 gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="flex-1 gap-2"
            disabled={!customerDetailsValid || !isValid}
          >
            <CheckCircle2 className="size-5" />
            Confirm Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
