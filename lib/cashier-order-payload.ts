import type { CartItem, Discount, OrderType, PaymentMethod } from '@/lib/pos-data'
import { formatHalfAndHalfOrderNote } from '@/lib/half-and-half'

export type CashierOrderTypeApi = 'dine_in' | 'takeaway' | 'delivery'

export function normalizeOrderTypeForApi(orderType: OrderType): CashierOrderTypeApi {
  return orderType === 'dine-in' ? 'dine_in' : orderType
}

export function mapCartItemsToOrderLines(cart: CartItem[]) {
  return cart.map((item) => {
    const toppings = (item.toppings ?? [])
      .map((topping) => {
        const toppingId = Number(topping.id)
        if (!Number.isFinite(toppingId)) return null
        return { topping_id: toppingId, quantity: 1 }
      })
      .filter((topping): topping is { topping_id: number; quantity: number } => topping !== null)

    const halfNote = formatHalfAndHalfOrderNote(item)
    const toppingNote =
      item.toppings?.length && !item.halfAndHalf
        ? `Toppings: ${item.toppings.map((topping) => topping.name).join(', ')}`
        : undefined
    const special_instructions = [halfNote, toppingNote].filter(Boolean).join(' | ') || undefined

    const menuItemId = item.halfAndHalf
      ? Number(item.halfAndHalf.first.menuItemId)
      : Number(item.id)

    return {
      menu_item_id: menuItemId,
      size: item.hasSizes ? (item.size ?? item.sizes?.[0]?.size) : undefined,
      crust_id: item.halfAndHalf ? item.halfAndHalf.first.crustId : item.crustId,
      toppings: toppings.length > 0 ? toppings : undefined,
      quantity: item.quantity,
      special_instructions,
    }
  })
}

export function buildCreateOrderRequestBody(params: {
  cart: CartItem[]
  orderType: OrderType
  discount: Discount | null
  customer: { name: string; phone: string; address?: string; deliveryNotes?: string; tableNumber?: string }
  paymentMethod: PaymentMethod
  kotPrinted?: boolean
  comments?: string
}): Record<string, unknown> {
  const normalizedOrderType = normalizeOrderTypeForApi(params.orderType)
  const trimmedComments = params.comments?.trim()

  const body: Record<string, unknown> = {
    order_type: normalizedOrderType,
    kot_printed: params.kotPrinted ?? false,
    customer_name: params.customer.name,
    customer_phone: params.customer.phone,
    customer_email: '',
    items: mapCartItemsToOrderLines(params.cart),
    notes: '',
    payment_method: params.paymentMethod,
  }

  if (trimmedComments) {
    body.comments = trimmedComments
  }

  if (normalizedOrderType === 'dine_in' && params.customer.tableNumber) {
    body.table_number = params.customer.tableNumber
  }
  if (normalizedOrderType === 'delivery') {
    body.delivery_address = params.customer.address ?? ''
    body.delivery_instructions = params.customer.deliveryNotes ?? ''
  }
  if (params.discount?.name) {
    body.discount_code = params.discount.name
  }

  return body
}

/**
 * Draft order body for KOT receipt — same shape as `POST /v1/cashier/orders` checkout
 * (no `status` / `payment_status` / `customer_id`; those are not on create-order and can break validation).
 */
export function buildKotReceiptRequestBody(params: {
  cart: CartItem[]
  orderType: OrderType
  discount: Discount | null
  customer: { name: string; phone: string; address?: string; deliveryNotes?: string; tableNumber?: string }
  comments?: string
}): Record<string, unknown> {
  return buildCreateOrderRequestBody({
    ...params,
    paymentMethod: 'cash',
    kotPrinted: true,
  })
}
