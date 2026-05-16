'use client'

import { User, Phone, MapPin, Hash, CheckCircle2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { isCustomerFormValid, type CustomerFormState, type OrderType } from '@/lib/pos-data'

interface CustomerDetailsPanelProps {
  orderType: OrderType
  value: CustomerFormState
  onChange: (value: CustomerFormState) => void
  /** Compact grid layout for the cart sidebar (always visible, no scroll). */
  compact?: boolean
}

function getMissingLabels(orderType: OrderType, value: CustomerFormState): string[] {
  const missing: string[] = []
  if (!value.name.trim()) missing.push('name')
  if (!value.phone.trim()) missing.push('phone')
  if (orderType === 'dine-in' && !value.tableNumber.trim()) missing.push('table')
  if (orderType === 'delivery' && !value.address.trim()) missing.push('address')
  return missing
}

export function CustomerDetailsPanel({
  orderType,
  value,
  onChange,
  compact = false,
}: CustomerDetailsPanelProps) {
  const isDelivery = orderType === 'delivery'
  const isDineIn = orderType === 'dine-in'
  const isValid = isCustomerFormValid(value, orderType)
  const missing = getMissingLabels(orderType, value)

  const patch = (partial: Partial<CustomerFormState>) => {
    onChange({ ...value, ...partial })
  }

  const fieldClass = compact ? 'h-9 text-sm bg-background' : 'h-9 text-sm'

  return (
    <div
      className={cn(
        compact
          ? 'rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-sm'
          : 'space-y-3 rounded-xl border border-border bg-secondary/40 p-3',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-md',
              isValid ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary',
            )}
          >
            <User className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold leading-tight text-foreground">Customer</p>
            {compact && !isValid && (
              <p className="truncate text-[10px] text-muted-foreground">
                Need {missing.join(', ')}
              </p>
            )}
          </div>
        </div>
        {compact && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
              isValid
                ? 'bg-success/15 text-success'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
            )}
          >
            {isValid ? (
              <>
                <CheckCircle2 className="size-3" />
                Ready
              </>
            ) : (
              <>
                <AlertCircle className="size-3" />
                Required
              </>
            )}
          </span>
        )}
      </div>

      <div
        className={cn(
          compact ? 'grid grid-cols-2 gap-2' : 'space-y-3',
          isDelivery && compact && 'grid-cols-1',
        )}
      >
        <div>
          <label htmlFor="cart-customer-name" className="sr-only">
            Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="cart-customer-name"
              autoComplete="name"
              value={value.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Customer name"
              className={cn(fieldClass, 'pl-8')}
            />
          </div>
        </div>

        <div>
          <label htmlFor="cart-customer-phone" className="sr-only">
            Phone
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="cart-customer-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={value.phone}
              onChange={(e) => patch({ phone: e.target.value })}
              placeholder="Phone number"
              className={cn(fieldClass, 'pl-8')}
            />
          </div>
        </div>

        {isDineIn && (
          <div className={cn(compact && 'col-span-2')}>
            <label htmlFor="cart-table-number" className="sr-only">
              Table number
            </label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cart-table-number"
                value={value.tableNumber}
                onChange={(e) => patch({ tableNumber: e.target.value })}
                placeholder="Table number"
                className={cn(fieldClass, 'pl-8')}
              />
            </div>
          </div>
        )}

        {isDelivery && (
          <>
            <div>
              <label htmlFor="cart-delivery-address" className="sr-only">
                Delivery address
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Textarea
                  id="cart-delivery-address"
                  value={value.address}
                  onChange={(e) => patch({ address: e.target.value })}
                  placeholder="Delivery address"
                  className={cn(
                    'resize-none bg-background pl-8 text-sm',
                    compact ? 'min-h-[52px]' : 'min-h-[72px]',
                  )}
                  autoComplete="street-address"
                />
              </div>
            </div>
            <div>
              <label htmlFor="cart-delivery-notes" className="sr-only">
                Delivery notes
              </label>
              <Input
                id="cart-delivery-notes"
                value={value.deliveryNotes}
                onChange={(e) => patch({ deliveryNotes: e.target.value })}
                placeholder="Delivery notes (optional)"
                className={fieldClass}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
