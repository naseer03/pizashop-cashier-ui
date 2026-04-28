'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/pos/top-bar'
import { MenuSection } from '@/components/pos/menu-section'
import { CartSection } from '@/components/pos/cart-section'
import { PaymentModal } from '@/components/pos/payment-modal'
import { OrderSuccessModal } from '@/components/pos/order-success-modal'
import { DiscountModal } from '@/components/pos/discount-modal'
import {
  clearClientAuth,
  getCashierDisplayName,
  getCashierInitials,
  getClientSession,
} from '@/lib/auth'
import { appendOrderFromCheckout } from '@/lib/order-history'
import {
  type CartItem,
  type CustomerDetails,
  type OrderType,
  type PaymentMethod,
  type Discount,
  TAX_RATE,
  calculateItemTotal,
  calculateDiscountAmount,
  generateOrderNumber,
} from '@/lib/pos-data'

interface CreateOrderApiResponse {
  success: boolean
  data?: {
    order_number?: string
    subtotal?: number
    tax_amount?: number
    delivery_fee?: number
    discount_amount?: number
    total_amount?: number
  }
  message?: string
}

export function PosApp() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('dine-in')
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const session = getClientSession()
  const cashierName = getCashierDisplayName(session?.employee)
  const cashierInitials = getCashierInitials(session?.employee)
  const cashierRole = session?.employee?.role?.name ?? 'Cashier'
  const [orderDetails, setOrderDetails] = useState<{
    orderNumber: string
    total: number
    paymentMethod: PaymentMethod
    change?: number
    customer: CustomerDetails
    orderType: OrderType
  } | null>(null)

  const handleLogout = useCallback(() => {
    clearClientAuth()
    router.replace('/login')
  }, [router])

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      if (item.hasSizes) {
        return [...prev, item]
      }

      const existingIndex = prev.findIndex((i) => i.id === item.id)
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
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === id)
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
    setCart((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setDiscount(null)
  }, [])

  const holdOrder = useCallback(() => {
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

  const handlePaymentConfirm = useCallback(
    async (method: PaymentMethod, customer: CustomerDetails, cashReceived?: number) => {
      const subtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0)
      const discountAmount =
        discount && discount.value > 0 ? calculateDiscountAmount(subtotal, discount) : 0
      const afterDiscount = subtotal - discountAmount
      const tax = afterDiscount * TAX_RATE
      const total = afterDiscount + tax
      const fallbackOrderNumber = generateOrderNumber()

      const token = session?.accessToken
      const tokenType = session?.tokenType || 'Bearer'
      if (!token) {
        alert('Please login again. Missing cashier session.')
        return
      }

      const normalizedOrderType: 'dine_in' | 'takeaway' | 'delivery' =
        orderType === 'dine-in' ? 'dine_in' : orderType

      const payload = {
        order_type: normalizedOrderType,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: '',
        table_number: normalizedOrderType === 'dine_in' ? '1' : undefined,
        delivery_address: customer.address,
        delivery_instructions: customer.deliveryNotes,
        items: cart.map((item) => {
          const toppings = (item.toppings ?? [])
            .map((topping) => {
              const toppingId = Number(topping.id)
              if (!Number.isFinite(toppingId)) return null
              return { topping_id: toppingId, quantity: 1 }
            })
            .filter((topping): topping is { topping_id: number; quantity: number } => topping !== null)

          return {
            menu_item_id: Number(item.id),
            size: item.hasSizes ? (item.size ?? 'medium') : undefined,
            crust_id: item.crustId,
            toppings: toppings.length > 0 ? toppings : undefined,
            quantity: item.quantity,
            special_instructions: item.toppings?.length
              ? `Toppings: ${item.toppings.map((topping) => topping.name).join(', ')}`
              : undefined,
          }
        }),
        discount_code: discount?.name,
        notes: '',
        payment_method: method,
      }

      let apiOrderNumber = fallbackOrderNumber
      // Keep cashier-facing amount consistent with the confirmed checkout total.
      let finalDisplayTotal = total
      let finalChange: number | undefined = undefined
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `${tokenType} ${token}`,
          },
          body: JSON.stringify(payload),
        })

        const result = (await response.json()) as CreateOrderApiResponse
        if (!response.ok || !result.success) {
          const baseMessage = result.message?.trim() || response.statusText || 'Failed to create order.'
          alert(`Create order failed (${response.status}): ${baseMessage}`)
          return
        }

        apiOrderNumber = result.data?.order_number ?? fallbackOrderNumber
        if (typeof result.data?.total_amount === 'number' && Number.isFinite(result.data.total_amount)) {
          finalDisplayTotal = result.data.total_amount
        }
      } catch {
        alert('Unable to create order right now. Please try again.')
        return
      }

      finalChange = cashReceived !== undefined ? cashReceived - finalDisplayTotal : undefined

      appendOrderFromCheckout({
        orderNumber: apiOrderNumber,
        total: finalDisplayTotal,
        paymentMethod: method,
        change: finalChange,
        orderType,
        customer,
        cart,
      })

      setOrderDetails({
        orderNumber: apiOrderNumber,
        total: finalDisplayTotal,
        paymentMethod: method,
        change: finalChange,
        customer,
        orderType,
      })

      setShowPayment(false)
      setShowSuccess(true)
    },
    [cart, discount, orderType],
  )

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false)
    setOrderDetails(null)
    clearCart()
  }, [clearCart])

  const handlePrintReceipt = useCallback(() => {
    window.print()
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  const discountAmount =
    discount && discount.value > 0 ? calculateDiscountAmount(subtotal, discount) : 0
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
        cashierName={cashierName}
        cashierInitials={cashierInitials}
        cashierRole={cashierRole}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <MenuSection searchQuery={searchQuery} onAddToCart={addToCart} />
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
        orderType={orderType}
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
          orderType={orderDetails.orderType}
          customer={orderDetails.customer}
          onClose={handleSuccessClose}
          onPrintReceipt={handlePrintReceipt}
        />
      )}
    </div>
  )
}
