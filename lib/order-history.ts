import type {
  CartItem,
  CustomerDetails,
  OrderType,
  PaymentMethod,
} from '@/lib/pos-data'

export type OrderPeriodFilter = 'day' | 'week' | 'month'

export interface SavedOrderLine {
  name: string
  quantity: number
}

export interface SavedOrder {
  id: string
  orderNumber: string
  createdAt: string
  total: number
  paymentMethod: PaymentMethod
  change?: number
  orderType: OrderType
  customer: CustomerDetails
  lines: SavedOrderLine[]
}

const STORAGE_KEY = 'pos_order_history'
const MAX_ORDERS = 500

function readRaw(): SavedOrder[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as SavedOrder[]
  } catch {
    return []
  }
}

export function loadOrders(): SavedOrder[] {
  return readRaw().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1)
  x.setHours(0, 0, 0, 0)
  return x
}

export function filterOrdersByPeriod(
  orders: SavedOrder[],
  period: OrderPeriodFilter,
  now = new Date(),
): SavedOrder[] {
  let start: Date
  if (period === 'day') {
    start = startOfLocalDay(now)
  } else if (period === 'week') {
    start = startOfWeekMonday(now)
  } else {
    start = startOfMonth(now)
  }
  const t = start.getTime()
  return orders.filter((o) => new Date(o.createdAt).getTime() >= t)
}

export function appendOrderFromCheckout(params: {
  orderNumber: string
  total: number
  paymentMethod: PaymentMethod
  change?: number
  orderType: OrderType
  customer: CustomerDetails
  cart: CartItem[]
}): void {
  if (typeof window === 'undefined') return

  const lines: SavedOrderLine[] = params.cart.map((item) => ({
    name: item.name,
    quantity: item.quantity,
  }))

  const record: SavedOrder = {
    id: `${Date.now()}-${params.orderNumber}`,
    orderNumber: params.orderNumber,
    createdAt: new Date().toISOString(),
    total: params.total,
    paymentMethod: params.paymentMethod,
    change: params.change,
    orderType: params.orderType,
    customer: params.customer,
    lines,
  }

  const prev = readRaw()
  const next = [record, ...prev].slice(0, MAX_ORDERS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('pos-orders-updated'))
}
