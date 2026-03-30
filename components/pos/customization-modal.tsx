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
  extraToppings, 
  sizePrices, 
  crustTypes 
} from '@/lib/pos-data'

interface CustomizationModalProps {
  item: MenuItem | null
  onClose: () => void
  onAdd: (item: CartItem) => void
}

export function CustomizationModal({ item, onClose, onAdd }: CustomizationModalProps) {
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [crust, setCrust] = useState<typeof crustTypes[number]>('regular')
  const [selectedToppings, setSelectedToppings] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (item) {
      setSize('medium')
      setCrust('regular')
      setSelectedToppings([])
      setQuantity(1)
    }
  }, [item])

  if (!item) return null

  const toggleTopping = (toppingId: string) => {
    setSelectedToppings(prev => 
      prev.includes(toppingId) 
        ? prev.filter(id => id !== toppingId)
        : [...prev, toppingId]
    )
  }

  const calculateTotal = () => {
    let total = item.price + sizePrices[size]
    selectedToppings.forEach(toppingId => {
      const topping = extraToppings.find(t => t.id === toppingId)
      if (topping) total += topping.price
    })
    return total * quantity
  }

  const handleAdd = () => {
    onAdd({
      ...item,
      quantity,
      size,
      crust,
      toppings: selectedToppings,
    })
    onClose()
  }

  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{item.image}</span>
            <span>{item.name}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Customize your pizza with size, crust, and extra toppings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Size Selection */}
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
                  {sizePrices[s] > 0 && (
                    <span className="block text-xs opacity-75">+${sizePrices[s].toFixed(2)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Crust Selection */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Crust</h4>
            <div className="grid grid-cols-2 gap-2">
              {crustTypes.map((c) => (
                <button
                  key={c}
                  onClick={() => setCrust(c)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                    crust === c
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Extra Toppings */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Extra Toppings</h4>
            <div className="grid grid-cols-2 gap-2">
              {extraToppings.map((topping) => (
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

          {/* Quantity */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Quantity</h4>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} className="gap-2">
            Add to Order
            <span className="font-bold">${calculateTotal().toFixed(2)}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
