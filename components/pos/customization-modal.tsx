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
  sizePrices,
} from '@/lib/pos-data'

interface CustomizationModalProps {
  item: MenuItem | null
  toppings?: ToppingOption[]
  crusts?: CrustOption[]
  onClose: () => void
  onAdd: (item: CartItem) => void
}

export function CustomizationModal({ item, toppings, crusts, onClose, onAdd }: CustomizationModalProps) {
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [crustId, setCrustId] = useState<string>('')
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (item) {
      const defaultSize = item.sizes?.find((option) => option.isDefault)?.size
      setSize(defaultSize ?? 'medium')
      setCrustId(crusts && crusts.length > 0 ? crusts[0].id : '')
      setSelectedToppings([])
      setQuantity(1)
    }
  }, [item, crusts])

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
    const selectedSizePrice = item.sizes?.find((option) => option.size === size)?.price
    const selectedCrust = availableCrusts.find((option) => option.id === crustId)
    const selectedCrustPrice = selectedCrust?.price ?? 0
    const unitPrice = hasSizeOptions
      ? (selectedSizePrice ?? item.price + sizePrices[size])
      : item.price
    let total = unitPrice + selectedCrustPrice
    selectedToppings.forEach(toppingId => {
      const topping = availableToppings.find(t => t.id === toppingId)
      if (topping) total += topping.price
    })
    return total * quantity
  }

  const handleAdd = () => {
    const selectedSizePrice = item.sizes?.find((option) => option.size === size)?.price
    const selectedCrust = availableCrusts.find((option) => option.id === crustId)
    const selectedCrustPrice = selectedCrust?.price ?? 0
    const parsedCrustId = Number(crustId)
    onAdd({
      ...item,
      quantity,
      size: hasSizeOptions ? size : undefined,
      crust: selectedCrust?.name,
      crustId: Number.isFinite(parsedCrustId) && crustId !== '' ? parsedCrustId : undefined,
      crustPrice: selectedCrust ? selectedCrustPrice : undefined,
      toppings: selectedToppings
        .map((id) => availableToppings.find((topping) => topping.id === id))
        .filter((topping): topping is ToppingOption => Boolean(topping)),
      unitPrice: hasSizeOptions ? selectedSizePrice : undefined,
    })
    onClose()
  }

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
          {hasSizeOptions && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Size</h4>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`py-3 rounded-lg text-sm font-medium transition-all ${
                      size === s
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    <span className="block text-xs opacity-75">
                      $
                      {(item.sizes?.find((option) => option.size === s)?.price ?? item.price + sizePrices[s]).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Crust Selection (API-only; hidden when none for this item category) */}
          {availableCrusts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Crust</h4>
              <div className="grid grid-cols-2 gap-2">
                {availableCrusts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCrustId(c.id)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                      crustId === c.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {c.name}
                    {c.price > 0 && <span className="block text-xs opacity-75">+${c.price.toFixed(2)}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extra Toppings */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Extra Toppings</h4>
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
              Add to Order
              <span className="font-bold">${calculateTotal().toFixed(2)}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
