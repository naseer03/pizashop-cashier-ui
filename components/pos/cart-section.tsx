'use client'

import { Minus, Plus, Trash2, ShoppingCart, Pause, Tag, Printer, Loader2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  type CartItem,
  type OrderType,
  type Discount,
  calculateItemTotal,
  calculateDiscountAmount,
  formatMenuSizeLabel,
} from '@/lib/pos-data'
import { getCartItemDisplayName } from '@/lib/half-and-half'

interface CartSectionProps {
  cart: CartItem[]
  orderType: OrderType
  discount: Discount | null
  /** Decimal tax rate after discount (e.g. 0.05); from cashier tax API */
  taxRateDecimal: number
  taxLoading: boolean
  kotPrinted: boolean
  kotPrinting: boolean
  onKotPrintedChange: (printed: boolean) => void | Promise<void>
  onUpdateQuantity: (id: string, delta: number) => void
  onRemoveItem: (id: string) => void
  onClearCart: () => void
  onHoldOrder: () => void
  onOpenDiscount: () => void
  orderComments: string
  onOpenComments: () => void
}

export function CartSection({
  cart,
  orderType,
  discount,
  taxRateDecimal,
  taxLoading,
  kotPrinted,
  kotPrinting,
  onKotPrintedChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onHoldOrder,
  onOpenDiscount,
  orderComments,
  onOpenComments,
}: CartSectionProps) {
  const hasComments = orderComments.trim().length > 0
  const subtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  const discountAmount = discount && discount.value > 0 ? calculateDiscountAmount(subtotal, discount) : 0
  const afterDiscount = subtotal - discountAmount
  const safeTaxRate = Number.isFinite(taxRateDecimal) && taxRateDecimal >= 0 ? taxRateDecimal : 0
  const tax = taxLoading ? 0 : afterDiscount * safeTaxRate
  const total = afterDiscount + tax
  const taxPercentLabel =
    safeTaxRate > 0
      ? `${(safeTaxRate * 100).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}%`
      : '0%'

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
    <div
      className={
        'flex min-h-0 w-full shrink-0 flex-col overflow-hidden bg-card border-t border-border ' +
        /* Mobile: grow into remaining column height, cap height so menu still fits */
        'max-lg:flex-1 max-lg:max-h-[min(70dvh,32rem)] ' +
        /* Desktop sidebar */
        'lg:h-full lg:max-h-none lg:w-80 lg:border-t-0 lg:border-l xl:w-96'
      }
    >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingCart className="size-4 sm:size-5 text-primary shrink-0" />
            <h2 className="font-semibold text-sm sm:text-base text-foreground truncate">Current Order</h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant={hasComments ? 'default' : 'outline'}
              size="sm"
              className="h-8 gap-1.5 px-2.5"
              onClick={onOpenComments}
              title={hasComments ? orderComments : 'Add order comments'}
            >
              <MessageSquare className="size-3.5 shrink-0" />
              <span className="text-xs hidden sm:inline">Comments</span>
            </Button>
            <Badge variant="outline" className="text-xs">{orderTypeLabels[orderType]}</Badge>
          </div>
        </div>
        {cart.length > 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </p>
        )}
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-2 pt-1 sm:px-4 sm:pb-3 sm:pt-2"
        role="region"
        aria-label="Cart line items"
      >
        {cart.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center py-6 text-muted-foreground sm:min-h-40 sm:py-10">
            <ShoppingCart className="size-10 sm:size-12 mb-2 sm:mb-3 opacity-50" />
            <p className="text-xs sm:text-sm">No items in cart</p>
            <p className="text-xs">Tap menu items to add</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {cart.map((item, index) => (
              <div
                key={`${item.id}-${item.size}-${item.crust}-${item.toppings?.map((topping) => topping.id).join(',')}-${index}`}
                className="bg-secondary rounded-lg p-2.5 sm:p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg">{item.image}</span>
                      <h3 className="font-medium text-foreground text-xs sm:text-sm truncate">
                        {getCartItemDisplayName(item)}
                      </h3>
                    </div>

                    {item.halfAndHalf && (
                      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">1st: </span>
                          {item.halfAndHalf.first.name}
                          {item.halfAndHalf.first.crust ? ` · ${item.halfAndHalf.first.crust}` : ''}
                          {item.halfAndHalf.first.toppings?.length
                            ? ` · +${item.halfAndHalf.first.toppings.map((t) => t.name).join(', ')}`
                            : ''}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">2nd: </span>
                          {item.halfAndHalf.second.name}
                          {item.halfAndHalf.second.crust ? ` · ${item.halfAndHalf.second.crust}` : ''}
                          {item.halfAndHalf.second.toppings?.length
                            ? ` · +${item.halfAndHalf.second.toppings.map((t) => t.name).join(', ')}`
                            : ''}
                        </p>
                      </div>
                    )}

                    {!item.halfAndHalf && (item.size || item.crust) && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.size && (
                          <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">
                            {formatMenuSizeLabel(item.size)}
                          </Badge>
                        )}
                        {item.crust && (
                          <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">
                            {item.crust}
                          </Badge>
                        )}
                      </div>
                    )}

                    {!item.halfAndHalf && item.toppings && item.toppings.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
      </div>

      {/* Summary */}
      {cart.length > 0 && (
        <div className="border-t border-border p-3 sm:p-4 space-y-2 sm:space-y-3 shrink-0 bg-card">
          {hasComments && (
            <p className="text-xs text-muted-foreground line-clamp-2 rounded-md bg-secondary/80 px-2.5 py-2">
              <span className="font-medium text-foreground">Comments: </span>
              {orderComments}
            </p>
          )}

          {/* Add Discount Button
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
          </Button> */}

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
              <span>{taxLoading ? 'Tax (loading…)' : `Tax (${taxPercentLabel})`}</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base sm:text-lg font-bold text-foreground pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <Button variant="outline" size="sm" onClick={onHoldOrder} className="gap-1 h-9 px-1 sm:gap-1.5 sm:px-2">
              <Pause className="size-3.5 shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">Hold</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCart}
              className="gap-1 h-9 px-1 sm:gap-1.5 sm:px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5 shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">Clear</span>
            </Button>
            <Button
              type="button"
              variant={kotPrinted ? 'default' : 'outline'}
              size="sm"
              title="Print kitchen order ticket"
              disabled={kotPrinting}
              onClick={() => void onKotPrintedChange(!kotPrinted)}
              className="gap-1 h-9 px-1 sm:gap-1.5 sm:px-2"
            >
              {kotPrinting ? (
                <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
              ) : (
                <Printer className="size-3.5 shrink-0" aria-hidden />
              )}
              <span className="truncate text-[11px] sm:text-xs leading-tight text-center">KOT</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
