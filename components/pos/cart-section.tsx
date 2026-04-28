'use client'

import { Minus, Plus, Trash2, ShoppingCart, Pause, CreditCard, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  type CartItem, 
  type OrderType,
  type Discount,
  calculateItemTotal, 
  calculateDiscountAmount,
  TAX_RATE
} from '@/lib/pos-data'

interface CartSectionProps {
  cart: CartItem[]
  orderType: OrderType
  discount: Discount | null
  onUpdateQuantity: (id: string, delta: number) => void
  onRemoveItem: (id: string) => void
  onClearCart: () => void
  onHoldOrder: () => void
  onCheckout: () => void
  onOpenDiscount: () => void
}

export function CartSection({
  cart,
  orderType,
  discount,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onHoldOrder,
  onCheckout,
  onOpenDiscount,
}: CartSectionProps) {
  const subtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  const discountAmount = discount && discount.value > 0 ? calculateDiscountAmount(subtotal, discount) : 0
  const afterDiscount = subtotal - discountAmount
  const tax = afterDiscount * TAX_RATE
  const total = afterDiscount + tax

  const getToppingNames = (toppings: NonNullable<CartItem['toppings']>) => {
    return toppings
      .map((topping) => topping.name)
      .join(', ')
  }

  const orderTypeLabels: Record<OrderType, string> = {
    'dine-in': 'Dine In',
    'takeaway': 'Takeaway',
    'delivery': 'Delivery',
  }

  return (
    <div className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden bg-card border-t border-border max-h-[50vh] lg:h-full lg:max-h-none lg:w-80 lg:border-t-0 lg:border-l xl:w-96">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-4 sm:size-5 text-primary" />
            <h2 className="font-semibold text-sm sm:text-base text-foreground">Current Order</h2>
          </div>
          <Badge variant="outline" className="text-xs">{orderTypeLabels[orderType]}</Badge>
        </div>
        {cart.length > 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </p>
        )}
      </div>

      {/* Cart Items */}
      <ScrollArea className="min-h-0 flex-1 basis-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 sm:h-48 text-muted-foreground">
            <ShoppingCart className="size-10 sm:size-12 mb-2 sm:mb-3 opacity-50" />
            <p className="text-xs sm:text-sm">No items in cart</p>
            <p className="text-xs">Tap menu items to add</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {cart.map((item, index) => (
              <div
                key={`${item.id}-${item.size}-${item.crust}-${item.toppings?.map((topping) => topping.id).join(',')}-${index}`}
                className="bg-secondary rounded-lg p-2.5 sm:p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg">{item.image}</span>
                      <h3 className="font-medium text-foreground text-xs sm:text-sm truncate">{item.name}</h3>
                    </div>
                    
                    {/* Customizations */}
                    {(item.size || item.crust) && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.size && (
                          <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">
                            {item.size}
                          </Badge>
                        )}
                        {item.crust && (
                          <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">
                            {item.crust}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {item.toppings && item.toppings.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        + {getToppingNames(item.toppings)}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-2 sm:mt-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => onUpdateQuantity(item.id, -1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-5 sm:w-6 text-center font-medium text-foreground text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => onUpdateQuantity(item.id, 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <span className="font-bold text-primary text-sm">
                    ${calculateItemTotal(item).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Summary */}
      {cart.length > 0 && (
        <div className="border-t border-border p-3 sm:p-4 space-y-2 sm:space-y-3 shrink-0 bg-card">
          {/* Add Discount Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 h-9"
            onClick={onOpenDiscount}
          >
            <Tag className="size-3.5" />
            {discount && discount.value > 0 ? (
              <span className="text-primary font-medium">{discount.name} Applied</span>
            ) : (
              'Add Discount'
            )}
          </Button>

          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            
            {discount && discount.value > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount ({discount.name})</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-muted-foreground">
              <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base sm:text-lg font-bold text-foreground pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={onHoldOrder} className="gap-1.5 h-9">
              <Pause className="size-3.5" />
              Hold
            </Button>
            <Button variant="outline" size="sm" onClick={onClearCart} className="gap-1.5 h-9 text-destructive hover:text-destructive">
              <Trash2 className="size-3.5" />
              Clear
            </Button>
          </div>
          
          <Button onClick={onCheckout} className="w-full h-10 sm:h-12 text-sm sm:text-base gap-2">
            <CreditCard className="size-4 sm:size-5" />
            Pay ${total.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  )
}
