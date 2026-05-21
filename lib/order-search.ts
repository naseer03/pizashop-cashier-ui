import {
  formatMenuSizeLabel,
  isModifierCategory,
  type ApiMenuItem,
  type OrderType,
  type PaymentMethod,
} from '@/lib/pos-data'
import { getUpstreamErrorMessage } from '@/lib/upstream-fetch'

export interface ApiOrderSearchItem {
  id?: number
  menu_item_id?: number
  name?: string
  size?: string | null
  crust?: string | { id?: number; name?: string; price?: number } | null
  toppings?: Array<{ id?: number; name?: string; price?: number }>
  quantity?: number
  unit_price?: number
  toppings_price?: number
  total_price?: number
  special_instructions?: string | null
  category?: { id?: number; name?: string } | string | null
}

export interface ApiOrderSearchCustomer {
  id?: number
  name?: string
  phone?: string
  email?: string | null
}

export interface ApiOrderSearchData {
  id: number
  order_number: string
  customer?: ApiOrderSearchCustomer | null
  order_type: 'dine_in' | 'takeaway' | 'delivery'
  status?: string
  table_number?: string | null
  delivery_address?: string | null
  delivery_instructions?: string | null
  items?: ApiOrderSearchItem[]
  subtotal?: number
  tax_amount?: number
  delivery_fee?: number
  discount_amount?: number
  discount_code?: string | null
  total_amount?: number
  payment_method?: string
  payment_status?: string
  kot_printed?: boolean
  paid_at?: string | null
  notes?: string | null
  comments?: string | null
  assigned_employee?: { id?: number; name?: string } | null
  estimated_ready_time?: string | null
  created_at?: string
  updated_at?: string
}

export interface OrderSearchResponse {
  success: boolean
  data?: ApiOrderSearchData
  message?: string
}

export interface OrderSearchToppingDisplay {
  name: string
  price: number | null
}

export interface OrderSearchLineDisplay {
  lineItemId: number | null
  menuItemId: number | null
  name: string
  category: string | null
  quantity: number
  size: string | null
  crust: string | null
  toppings: OrderSearchToppingDisplay[]
  specialInstructions: string | null
  unitPrice: number | null
  toppingsPrice: number | null
  totalPrice: number | null
}

export type MenuItemLookup = Map<
  number,
  { category: string; hasSizes: boolean; basePrice: number }
>

export interface OrderSearchDisplay {
  id: number
  orderNumber: string
  orderType: OrderType
  status: string
  paymentStatus: string
  paymentMethod: PaymentMethod
  kotPrinted: boolean
  customerName: string
  customerPhone: string
  tableNumber: string | null
  deliveryAddress: string | null
  deliveryInstructions: string | null
  subtotal: number
  taxAmount: number
  deliveryFee: number
  discountAmount: number
  discountCode: string | null
  totalAmount: number
  notes: string | null
  comments: string | null
  assignedEmployee: string | null
  createdAt: string | null
  lines: OrderSearchLineDisplay[]
}

export function normalizeOrderTypeFromApi(
  orderType: ApiOrderSearchData['order_type'] | string | undefined,
): OrderType {
  if (orderType === 'dine_in') return 'dine-in'
  if (orderType === 'takeaway' || orderType === 'delivery') return orderType
  return 'dine-in'
}

export function parseOrderSearchResponse(json: unknown): {
  success: boolean
  data: ApiOrderSearchData | null
  message: string | null
} {
  if (!json || typeof json !== 'object') {
    return { success: false, data: null, message: 'Invalid response from server.' }
  }

  const record = json as Record<string, unknown>
  const message = getUpstreamErrorMessage(record, 'Order not found.')

  let rawData: unknown = record.data
  if (rawData && typeof rawData === 'object') {
    const nested = rawData as Record<string, unknown>
    if (nested.order && typeof nested.order === 'object') {
      rawData = nested.order
    }
  }

  if (!rawData || typeof rawData !== 'object') {
    return {
      success: record.success === true,
      data: null,
      message,
    }
  }

  const order = rawData as ApiOrderSearchData
  const hasIdentity =
    (typeof order.id === 'number' && Number.isFinite(order.id)) ||
    (typeof order.order_number === 'string' && order.order_number.trim().length > 0)

  if (!hasIdentity) {
    return { success: false, data: null, message }
  }

  return {
    success: record.success === true || hasIdentity,
    data: order,
    message: record.success === true ? null : message,
  }
}

function parseCrustName(crust: ApiOrderSearchItem['crust']): string | null {
  if (crust == null) return null
  if (typeof crust === 'string' && crust.trim()) return crust.trim()
  if (typeof crust === 'object' && typeof crust.name === 'string' && crust.name.trim()) {
    return crust.name.trim()
  }
  return null
}

function parsePaymentMethod(method: string | undefined): PaymentMethod {
  if (method === 'card' || method === 'online') return method
  return 'cash'
}

function parseItemCategory(
  item: ApiOrderSearchItem,
  menuLookup?: MenuItemLookup,
): string | null {
  const raw = item.category
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (raw && typeof raw === 'object' && typeof raw.name === 'string' && raw.name.trim()) {
    return raw.name.trim()
  }
  const menuItemId = item.menu_item_id
  if (menuItemId != null && menuLookup?.has(menuItemId)) {
    return menuLookup.get(menuItemId)!.category
  }
  return null
}

export function buildMenuItemLookup(menuItems: ApiMenuItem[]): MenuItemLookup {
  const map: MenuItemLookup = new Map()
  for (const item of menuItems) {
    if (!Number.isFinite(item.id)) continue
    if (isModifierCategory(item.category?.name ?? '')) continue
    map.set(item.id, {
      category: item.category?.name?.trim() || 'Uncategorized',
      hasSizes: Boolean(item.category?.has_sizes),
      basePrice: item.base_price,
    })
  }
  return map
}

export function mapApiOrderSearchToDisplay(
  data: ApiOrderSearchData,
  menuLookup?: MenuItemLookup,
): OrderSearchDisplay {
  const lines: OrderSearchLineDisplay[] = (data.items ?? []).map((item) => {
    const toppings: OrderSearchToppingDisplay[] =
      item.toppings?.map((t) => ({
        name: typeof t.name === 'string' && t.name.trim() ? t.name.trim() : 'Topping',
        price:
          typeof t.price === 'number' && Number.isFinite(t.price) ? t.price : null,
      })) ?? []

    const menuItemId =
      typeof item.menu_item_id === 'number' && Number.isFinite(item.menu_item_id)
        ? item.menu_item_id
        : null

    return {
      lineItemId:
        typeof item.id === 'number' && Number.isFinite(item.id) ? item.id : null,
      menuItemId,
      name: item.name?.trim() || 'Item',
      category: parseItemCategory(item, menuLookup),
      quantity: Number.isFinite(item.quantity) ? Number(item.quantity) : 1,
      size:
        item.size != null && String(item.size).trim() !== ''
          ? formatMenuSizeLabel(String(item.size))
          : null,
      crust: parseCrustName(item.crust),
      toppings,
      specialInstructions:
        typeof item.special_instructions === 'string' && item.special_instructions.trim()
          ? item.special_instructions.trim()
          : null,
      unitPrice:
        typeof item.unit_price === 'number' && Number.isFinite(item.unit_price)
          ? item.unit_price
          : null,
      toppingsPrice:
        typeof item.toppings_price === 'number' && Number.isFinite(item.toppings_price)
          ? item.toppings_price
          : null,
      totalPrice:
        typeof item.total_price === 'number' && Number.isFinite(item.total_price)
          ? item.total_price
          : null,
    }
  })

  const customer = data.customer

  return {
    id: data.id,
    orderNumber: data.order_number,
    orderType: normalizeOrderTypeFromApi(data.order_type ?? 'dine_in'),
    status: data.status?.trim() || 'unknown',
    paymentStatus: data.payment_status?.trim() || 'unknown',
    paymentMethod: parsePaymentMethod(data.payment_method),
    kotPrinted: Boolean(data.kot_printed),
    customerName: customer?.name?.trim() || '—',
    customerPhone: customer?.phone?.trim() || '—',
    tableNumber: data.table_number?.trim() || null,
    deliveryAddress: data.delivery_address?.trim() || null,
    deliveryInstructions: data.delivery_instructions?.trim() || null,
    subtotal: data.subtotal ?? 0,
    taxAmount: data.tax_amount ?? 0,
    deliveryFee: data.delivery_fee ?? 0,
    discountAmount: data.discount_amount ?? 0,
    discountCode: data.discount_code?.trim() || null,
    totalAmount: data.total_amount ?? 0,
    notes: data.notes?.trim() || null,
    comments: data.comments?.trim() || null,
    assignedEmployee: data.assigned_employee?.name?.trim() || null,
    createdAt: data.created_at ?? null,
    lines,
  }
}
