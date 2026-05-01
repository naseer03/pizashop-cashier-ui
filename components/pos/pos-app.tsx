'use client'

import { useState, useCallback, useEffect } from 'react'
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
import { buildKotReceiptRequestBody, mapCartItemsToOrderLines } from '@/lib/cashier-order-payload'
import { printKotReceiptFromResponse } from '@/lib/kot-receipt-print'
import {
  type CartItem,
  type CustomerDetails,
  type OrderType,
  type PaymentMethod,
  type Discount,
  calculateItemTotal,
  calculateDiscountAmount,
  generateOrderNumber,
  parseTaxRateDecimalFromCashierTaxApi,
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

interface KotApiItem {
  name?: string
  quantity?: number
}

interface KotApiData {
  order_number?: string
  order_type?: 'dine_in' | 'takeaway' | 'delivery'
  table_number?: string | null
  items?: KotApiItem[]
  total_amount?: number
}

interface KotApiResponse {
  success?: boolean
  data?: KotApiData
}

export function PosApp() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('dine-in')
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showKotSuccess, setShowKotSuccess] = useState(false)
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
  const [kotSuccessDetails, setKotSuccessDetails] = useState<{
    orderNumber: string
    total: number
    customer: CustomerDetails
    orderType: OrderType
    tableNumber?: string | null
    items: Array<{ name: string; quantity: number }>
  } | null>(null)
  const [taxRateDecimal, setTaxRateDecimal] = useState(0)
  const [taxLoading, setTaxLoading] = useState(true)
  const [kotPrinted, setKotPrinted] = useState(false)
  const [kotPrinting, setKotPrinting] = useState(false)

  useEffect(() => {
    const loadTax = async () => {
      const token = session?.accessToken
      const tokenType = session?.tokenType || 'Bearer'
      if (!token) {
        setTaxRateDecimal(0)
        setTaxLoading(false)
        return
      }

      setTaxLoading(true)
      try {
        const res = await fetch('/api/tax', {
          headers: {
            Accept: 'application/json',
            Authorization: `${tokenType} ${token}`,
          },
          cache: 'no-store',
        })
        if (!res.ok) {
          setTaxRateDecimal(0)
          return
        }
        const json: unknown = await res.json()
        const parsed = parseTaxRateDecimalFromCashierTaxApi(json)
        setTaxRateDecimal(parsed ?? 0)
      } catch {
        setTaxRateDecimal(0)
      } finally {
        setTaxLoading(false)
      }
    }

    void loadTax()
  }, [session?.accessToken, session?.tokenType])

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
    setKotPrinted(false)
    setKotPrinting(false)
  }, [])

  const handleKotPrintedChange = useCallback(
    async (printed: boolean) => {
      if (!printed) {
        setKotPrinted(false)
        return
      }
      if (cart.length === 0) return

      const token = session?.accessToken
      const tokenType = session?.tokenType || 'Bearer'
      if (!token) {
        alert('Please login again. Missing cashier session.')
        return
      }

      setKotPrinting(true)
      try {
        const body = buildKotReceiptRequestBody({ cart, orderType, discount })
        const response = await fetch('/api/orders/kot', {
          method: 'POST',
          headers: {
            Accept: 'application/json, application/pdf, text/html;q=0.9,*/*;q=0.8',
            'Content-Type': 'application/json',
            Authorization: `${tokenType} ${token}`,
          },
          body: JSON.stringify(body),
        })
        const responseForMeta = response.clone()
        await printKotReceiptFromResponse(response)
        setKotPrinted(true)

        let apiOrderNumber: string | undefined
        let apiTableNumber: string | null | undefined
        let apiOrderType: OrderType | undefined
        let apiItems: Array<{ name: string; quantity: number }> = []
        let apiTotal: number | undefined

        const metaContentType = responseForMeta.headers.get('content-type') ?? ''
        if (metaContentType.includes('application/json')) {
          try {
            const json = (await responseForMeta.json()) as KotApiResponse
            const data = json?.data
            apiOrderNumber = data?.order_number
            apiTableNumber = data?.table_number
            if (data?.order_type === 'dine_in') apiOrderType = 'dine-in'
            if (data?.order_type === 'takeaway') apiOrderType = 'takeaway'
            if (data?.order_type === 'delivery') apiOrderType = 'delivery'
            apiItems =
              data?.items?.map((item) => ({
                name: item.name || 'Item',
                quantity: Number.isFinite(item.quantity) ? Number(item.quantity) : 1,
              })) ?? []
            if (typeof data?.total_amount === 'number' && Number.isFinite(data.total_amount)) {
              apiTotal = data.total_amount
            }
          } catch {
            // ignore parsing errors and keep UI fallbacks
          }
        }

        const subtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0)
        const discountAmount =
          discount && discount.value > 0 ? calculateDiscountAmount(subtotal, discount) : 0
        const afterDiscount = subtotal - discountAmount
        const tax =
          afterDiscount * (Number.isFinite(taxRateDecimal) && taxRateDecimal >= 0 ? taxRateDecimal : 0)
        const total = apiTotal ?? afterDiscount + tax
        setKotSuccessDetails({
          orderNumber: apiOrderNumber ?? `KOT-${Date.now().toString(36).toUpperCase()}`,
          total,
          customer: { name: 'Walk-in', phone: '0000000000' },
          orderType: apiOrderType ?? orderType,
          tableNumber: apiTableNumber,
          items: apiItems,
        })
        setShowKotSuccess(true)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unable to load KOT receipt.'
        alert(message)
        setKotPrinted(false)
      } finally {
        setKotPrinting(false)
      }
    },
    [cart, discount, orderType, session?.accessToken, session?.tokenType, taxRateDecimal],
  )

  const holdOrder = useCallback(() => {
    alert('Order held! (Demo only)')
  }, [])

  const handleCheckout = useCallback(() => {
    if (cart.length === 0 || taxLoading) return
    setShowPayment(true)
  }, [cart.length, taxLoading])

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
      const tax = afterDiscount * (Number.isFinite(taxRateDecimal) && taxRateDecimal >= 0 ? taxRateDecimal : 0)
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
        kot_printed: kotPrinted,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: '',
        table_number: normalizedOrderType === 'dine_in' ? '1' : undefined,
        delivery_address: customer.address,
        delivery_instructions: customer.deliveryNotes,
        items: mapCartItemsToOrderLines(cart),
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
    [cart, discount, orderType, session?.accessToken, session?.tokenType, taxRateDecimal, kotPrinted],
  )

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false)
    setOrderDetails(null)
    clearCart()
  }, [clearCart])

  const handleKotSuccessClose = useCallback(() => {
    setShowKotSuccess(false)
    setKotSuccessDetails(null)
  }, [])

  const handlePrintReceipt = useCallback(() => {
    window.print()
  }, [])

  const subtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  const discountAmount =
    discount && discount.value > 0 ? calculateDiscountAmount(subtotal, discount) : 0
  const safeTaxRate = Number.isFinite(taxRateDecimal) && taxRateDecimal >= 0 ? taxRateDecimal : 0
  const afterDiscount = subtotal - discountAmount
  const tax = taxLoading ? 0 : afterDiscount * safeTaxRate
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
          taxRateDecimal={safeTaxRate}
          taxLoading={taxLoading}
          kotPrinted={kotPrinted}
          kotPrinting={kotPrinting}
          onKotPrintedChange={handleKotPrintedChange}
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
      {kotSuccessDetails && (
        <OrderSuccessModal
          open={showKotSuccess}
          orderNumber={kotSuccessDetails.orderNumber}
          total={kotSuccessDetails.total}
          paymentMethod="cash"
          orderType={kotSuccessDetails.orderType}
          customer={kotSuccessDetails.customer}
          kotTableNumber={kotSuccessDetails.tableNumber}
          kotItems={kotSuccessDetails.items}
          onClose={handleKotSuccessClose}
          variant="kot"
        />
      )}
    </div>
  )
}
