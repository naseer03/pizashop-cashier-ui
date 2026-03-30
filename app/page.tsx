'use client'

import { useState, useCallback } from 'react'
import { TopBar } from '@/components/pos/top-bar'
import { MenuSection } from '@/components/pos/menu-section'
import { CartSection } from '@/components/pos/cart-section'
import { PaymentModal } from '@/components/pos/payment-modal'
import { OrderSuccessModal } from '@/components/pos/order-success-modal'
import { DiscountModal } from '@/components/pos/discount-modal'
import { 
  type CartItem, 
  type OrderType, 
  type PaymentMethod,
  type Discount,
  TAX_RATE,
  calculateItemTotal,
  calculateDiscountAmount,
  generateOrderNumber 
} from '@/lib/pos-data'

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('dine-in')
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [orderDetails, setOrderDetails] = useState<{
    orderNumber: string
    total: number
    paymentMethod: PaymentMethod
    change?: number
  } | null>(null)

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      // For pizzas with customizations, always add as new item
      if (item.category === 'pizza') {
        return [...prev, item]
      }
      
      // For other items, check if same item exists
      const existingIndex = prev.findIndex(i => i.id === item.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        }
        return updated
      }
      
      return [...prev, item]
    })
  }, [])

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.id === id)
      if (index === -1) return prev
      
      const newQuantity = prev[index].quantity + delta
      if (newQuantity <= 0) {
        return prev.filter((_, i) => i !== index)
      }
      
      const updated = [...prev]
      updated[index] = { ...updated[index], quantity: newQuantity }
      return updated
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setDiscount(null)
  }, [])

  const holdOrder = useCallback(() => {
    // In a real app, this would save to held orders
    alert('Order held! (Demo only)')
  }, [])

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return
    setShowPayment(true)
  }, [cart.length])

  const handleApplyDiscount = useCallback((newDiscount: Discount) => {
    if (newDiscount.value === 0) {
      setDiscount(null)
    } else {
      setDiscount(newDiscount)
    }
  }, [])

  const handlePaymentConfirm = useCallback((method: PaymentMethod, cashReceived?: number) => {
    const subtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0)
    const discountAmount = discount && discount.value > 0 ? calculateDiscountAmount(subtotal, discount) : 0
    const afterDiscount = subtotal - discountAmount
    const tax = afterDiscount * TAX_RATE
    const total = afterDiscount + tax
    
    const change = cashReceived ? cashReceived - total : undefined

    setOrderDetails({
      orderNumber: generateOrderNumber(),
      total,
      paymentMethod: method,
      change,
    })
    
    setShowPayment(false)
    setShowSuccess(true)
  }, [cart, discount])

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false)
    setOrderDetails(null)
    clearCart()
  }, [clearCart])

  const handlePrintReceipt = useCallback(() => {
    // In a real app, this would trigger receipt printing
    window.print()
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  const discountAmount = discount && discount.value > 0 ? calculateDiscountAmount(subtotal, discount) : 0
  const afterDiscount = subtotal - discountAmount
  const tax = afterDiscount * TAX_RATE
  const total = afterDiscount + tax

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-background">
      <TopBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        orderType={orderType}
        setOrderType={setOrderType}
      />
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <MenuSection 
          searchQuery={searchQuery} 
          onAddToCart={addToCart} 
        />
        <CartSection
          cart={cart}
          orderType={orderType}
          discount={discount}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onHoldOrder={holdOrder}
          onCheckout={handleCheckout}
          onOpenDiscount={() => setShowDiscount(true)}
        />
      </div>

      <DiscountModal
        open={showDiscount}
        onClose={() => setShowDiscount(false)}
        onApply={handleApplyDiscount}
        currentDiscount={discount}
      />

      <PaymentModal
        open={showPayment}
        total={total}
        onClose={() => setShowPayment(false)}
        onConfirm={handlePaymentConfirm}
      />

      {orderDetails && (
        <OrderSuccessModal
          open={showSuccess}
          orderNumber={orderDetails.orderNumber}
          total={orderDetails.total}
          paymentMethod={orderDetails.paymentMethod}
          change={orderDetails.change}
          onClose={handleSuccessClose}
          onPrintReceipt={handlePrintReceipt}
        />
      )}
    </div>
  )
}
