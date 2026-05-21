'use client'

import { useState, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  type MenuItem,
  type CartItem,
  type ToppingOption,
  type CrustOption,
  formatMenuSizeLabel,
  isHalfMenuSize,
} from '@/lib/pos-data'
import { resolveHalfSizeKey } from '@/lib/half-and-half'

interface CustomizationModalProps {
  item: MenuItem | null
  toppings?: ToppingOption[]
  toppingsLoading?: boolean
  toppingsError?: string
  crusts?: CrustOption[]
  crustsLoading?: boolean
  crustsError?: string
  onClose: () => void
  onAdd: (item: CartItem) => void
  /** When true, size is locked to half (second half of a half-and-half). */
  lockSizeToHalf?: boolean
  /** Called instead of onAdd when user confirms with half size (first half step). */
  onHalfSizeFirstComplete?: (item: CartItem) => void
}

export function CustomizationModal({
  item,
  toppings,
  toppingsLoading = false,
  toppingsError,
  crusts,
  crustsLoading = false,
  crustsError,
  onClose,
  onAdd,
  lockSizeToHalf = false,
  onHalfSizeFirstComplete,
}: CustomizationModalProps) {
  const [size, setSize] = useState<string>('')
  const [crustId, setCrustId] = useState<string>('')
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (item) {
      const halfKey = resolveHalfSizeKey(item)
      if (lockSizeToHalf && halfKey) {
        setSize(halfKey)
      } else {
        const defaultSize = item.sizes?.find((option) => option.isDefault)?.size
        const firstSize = item.sizes?.[0]?.size
        setSize(defaultSize ?? firstSize ?? '')
      }
      setCrustId(crusts && crusts.length > 0 ? crusts[0].id : '')
      setSelectedToppings([])
      setQuantity(1)
    }
  }, [item, crusts, lockSizeToHalf])

  if (!item) return null

  const hasSizeOptions = Boolean(item.sizes && item.sizes.length > 0)
  // Only use provided toppings; if none are available from API, treat as no-toppings
  // (avoids demo fallback IDs like "t1" that can't be sent to backend as numeric topping_id).
  const availableToppings = toppings && toppings.length > 0 ? toppings : []
  const availableCrusts = crusts && crusts.length > 0 ? crusts : []

  const toggleTopping = (toppingId: string) => {
    setSelectedToppings(prev => 
      prev.includes(toppingId) 
        ? prev.filter(id => id !== toppingId)
        : [...prev, toppingId]
    )
  }

  const calculateTotal = () => {
    const effectiveSize = hasSizeOptions ? (size || item.sizes?.[0]?.size || '') : ''
    const selectedSizePrice = item.sizes?.find((option) => option.size === effectiveSize)?.price
    const selectedCrust = availableCrusts.find((option) => option.id === crustId)
    const selectedCrustPrice = selectedCrust?.price ?? 0
    const unitPrice = hasSizeOptions ? (selectedSizePrice ?? item.price) : item.price
    let total = unitPrice + selectedCrustPrice
    selectedToppings.forEach(toppingId => {
      const topping = availableToppings.find(t => t.id === toppingId)
      if (topping) total += topping.price
    })
    return total * quantity
  }

  const buildCartDraft = (): CartItem => {
    const resolvedSize = hasSizeOptions ? (size || item.sizes?.[0]?.size || '') : ''
    const selectedSizePrice = item.sizes?.find((option) => option.size === resolvedSize)?.price
    const selectedCrust = availableCrusts.find((option) => option.id === crustId)
    const selectedCrustPrice = selectedCrust?.price ?? 0
    const parsedCrustId = Number(crustId)
    return {
      ...item,
      quantity,
      size: hasSizeOptions ? resolvedSize : undefined,
      crust: selectedCrust?.name,
      crustId: Number.isFinite(parsedCrustId) && crustId !== '' ? parsedCrustId : undefined,
      crustPrice: selectedCrust ? selectedCrustPrice : undefined,
      toppings: selectedToppings
        .map((id) => availableToppings.find((topping) => topping.id === id))
        .filter((topping): topping is ToppingOption => Boolean(topping)),
      unitPrice: hasSizeOptions ? (selectedSizePrice ?? item.price) : undefined,
    }
  }

  const handleAdd = () => {
    const draft = buildCartDraft()
    const resolvedSize = draft.size ?? ''
    if (!lockSizeToHalf && isHalfMenuSize(resolvedSize) && onHalfSizeFirstComplete) {
      onHalfSizeFirstComplete(draft)
      onClose()
      return
    }
    onAdd(draft)
    onClose()
  }

  const isHalfLocked = lockSizeToHalf && Boolean(resolveHalfSizeKey(item))
  const addButtonLabel = isHalfLocked ? 'Add second half' : 'Add to Order'

  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="flex min-h-0 max-h-[90vh] flex-col sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{item.image}</span>
            <span>{item.name}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Customize your pizza with size, crust, and extra toppings
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-4 pr-1">
          {isHalfLocked && (
            <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
              Customize the <span className="font-medium">second half</span> (size: Half).
            </p>
          )}

          {hasSizeOptions && !isHalfLocked && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Size</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {(item.sizes ?? []).map((option) => (
                  <button
                    key={option.size}
                    type="button"
                    onClick={() => setSize(option.size)}
                    className={`py-3 rounded-lg text-sm font-medium transition-all ${
                      size === option.size
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {formatMenuSizeLabel(option.size)}
                    <span className="block text-xs opacity-75">${option.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
              {isHalfMenuSize(size) && onHalfSizeFirstComplete && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Half size requires choosing a second item from the menu before adding to the order.
                </p>
              )}
            </div>
          )}

          {isHalfLocked && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Size</h4>
              <p className="text-sm font-medium text-primary">{formatMenuSizeLabel(size)}</p>
            </div>
          )}

          {/* Crust Selection (loaded per menu category from API) */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Crust</h4>
            {crustsLoading ? (
              <p className="text-sm text-muted-foreground">Loading crusts…</p>
            ) : crustsError ? (
              <p className="text-sm text-destructive" role="alert">
                {crustsError}
              </p>
            ) : availableCrusts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No crust options for this category.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableCrusts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCrustId(c.id)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                      crustId === c.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {c.name}
                    {c.price > 0 && (
                      <span className="block text-xs opacity-75">+${c.price.toFixed(2)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Extra Toppings */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Extra Toppings</h4>
            {toppingsLoading ? (
              <p className="text-sm text-muted-foreground">Loading toppings…</p>
            ) : toppingsError ? (
              <p className="text-sm text-destructive" role="alert">
                {toppingsError}
              </p>
            ) : availableToppings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No extra toppings for this category.</p>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableToppings.map((topping) => (
                <label
                  key={topping.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    selectedToppings.includes(topping.id)
                      ? 'bg-primary/10 border-primary'
                      : 'bg-secondary hover:bg-secondary/80'
                  } border`}
                >
                  <Checkbox
                    checked={selectedToppings.includes(topping.id)}
                    onCheckedChange={() => toggleTopping(topping.id)}
                  />
                  <span className="flex-1 text-sm text-foreground">{topping.name}</span>
                  <span className="text-xs text-muted-foreground">+${topping.price.toFixed(2)}</span>
                </label>
              ))}
            </div>
            )}
          </div>

        </div>

        <DialogFooter className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Quantity</span>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="size-4" />
              </Button>
              <span className="text-xl font-bold text-foreground w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto">
              {isHalfMenuSize(size) && onHalfSizeFirstComplete && !lockSizeToHalf
                ? 'Choose second half'
                : addButtonLabel}
              <span className="font-bold">${calculateTotal().toFixed(2)}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
