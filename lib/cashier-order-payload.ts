import type { CartItem, Discount, OrderType } from '@/lib/pos-data'

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
  })
}

/**
 * Draft order body for KOT receipt — same shape as `POST /v1/cashier/orders` checkout
 * (no `status` / `payment_status` / `customer_id`; those are not on create-order and can break validation).
 */
export function buildKotReceiptRequestBody(params: {
  cart: CartItem[]
  orderType: OrderType
  discount: Discount | null
}): Record<string, unknown> {
  const normalizedOrderType = normalizeOrderTypeForApi(params.orderType)

  const body: Record<string, unknown> = {
    order_type: normalizedOrderType,
    kot_printed: true,
    customer_name: 'Walk-in',
    customer_phone: '0000000000',
    customer_email: '',
    items: mapCartItemsToOrderLines(params.cart),
    notes: '',
    payment_method: 'cash',
  }

  if (normalizedOrderType === 'dine_in') {
    body.table_number = '1'
  }
  if (normalizedOrderType === 'delivery') {
    body.delivery_address = ''
    body.delivery_instructions = ''
  }
  if (params.discount?.name) {
    body.discount_code = params.discount.name
  }

  return body
}
