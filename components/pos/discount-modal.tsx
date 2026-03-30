'use client'

import { useState } from 'react'
import { Percent, DollarSign, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { type Discount, type DiscountType, presetDiscounts } from '@/lib/pos-data'
import { cn } from '@/lib/utils'

interface DiscountModalProps {
  open: boolean
  onClose: () => void
  onApply: (discount: Discount) => void
  currentDiscount: Discount | null
}

export function DiscountModal({
  open,
  onClose,
  onApply,
  currentDiscount,
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<DiscountType>(
    currentDiscount?.type || 'percentage'
  )
  const [customValue, setCustomValue] = useState(
    currentDiscount?.value.toString() || ''
  )

  const handlePresetSelect = (discount: Discount) => {
    onApply(discount)
    onClose()
  }

  const handleCustomApply = () => {
    const value = parseFloat(customValue)
    if (isNaN(value) || value <= 0) return
    
    // Validate percentage doesn't exceed 100
    if (discountType === 'percentage' && value > 100) return
    
    onApply({
      type: discountType,
      value,
      name: discountType === 'percentage' ? `${value}% Off` : `$${value} Off`,
    })
    onClose()
  }

  const handleRemoveDiscount = () => {
    onApply({ type: 'fixed', value: 0, name: 'No Discount' })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="size-5 text-primary" />
            Apply Discount
          </DialogTitle>
          <DialogDescription>
            Select a preset discount or enter a custom amount
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preset Discounts */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Quick Discounts</h4>
            <div className="grid grid-cols-3 gap-2">
              {presetDiscounts.map((discount) => (
                <Button
                  key={`${discount.type}-${discount.value}`}
                  variant="outline"
                  className={cn(
                    "h-12 flex-col gap-0.5",
                    currentDiscount?.type === discount.type && 
                    currentDiscount?.value === discount.value && 
                    "border-primary bg-primary/10"
                  )}
                  onClick={() => handlePresetSelect(discount)}
                >
                  <span className="text-sm font-semibold">{discount.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {discount.type === 'percentage' ? 'Percent' : 'Fixed'}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or custom</span>
            </div>
          </div>

          {/* Custom Discount */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Custom Discount</h4>
            
            {/* Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={discountType === 'percentage' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setDiscountType('percentage')}
              >
                <Percent className="size-4" />
                Percentage
              </Button>
              <Button
                variant={discountType === 'fixed' ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setDiscountType('fixed')}
              >
                <DollarSign className="size-4" />
                Fixed Amount
              </Button>
            </div>

            {/* Value Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {discountType === 'percentage' ? (
                  <Percent className="size-4" />
                ) : (
                  <DollarSign className="size-4" />
                )}
              </div>
              <Input
                type="number"
                placeholder={discountType === 'percentage' ? 'Enter percentage (1-100)' : 'Enter amount'}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="pl-9 h-12 text-lg"
                min="0"
                max={discountType === 'percentage' ? '100' : undefined}
              />
            </div>

            <Button 
              onClick={handleCustomApply} 
              className="w-full h-11"
              disabled={!customValue || parseFloat(customValue) <= 0}
            >
              Apply Custom Discount
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          {currentDiscount && currentDiscount.value > 0 && (
            <Button
              variant="outline"
              onClick={handleRemoveDiscount}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <X className="size-4" />
              Remove Discount
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="ml-auto">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
