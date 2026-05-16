import {
  type CartHalfSide,
  type CartItem,
  type MenuItem,
  isHalfMenuSize,
  normalizeMenuSizeKey,
} from '@/lib/pos-data'

export function menuItemHasHalfSize(item: MenuItem): boolean {
  return item.sizes?.some((option) => isHalfMenuSize(option.size)) ?? false
}

export function calculateHalfSideUnitPrice(
  item: Pick<CartItem, 'size' | 'sizes' | 'price' | 'unitPrice' | 'toppings' | 'crustPrice'>,
): number {
  let base: number
  if (item.unitPrice != null) {
    base = item.unitPrice
  } else if (item.size && item.sizes && item.sizes.length > 0) {
    const match = item.sizes.find((s) => s.size === item.size)
    base = match?.price ?? item.price
  } else {
    base = item.price
  }

  const toppingsTotal =
    item.toppings?.reduce((sum, topping) => sum + topping.price, 0) ?? 0
  const crust = item.crustPrice ?? 0
  return base + toppingsTotal + crust
}

export function buildHalfAndHalfCartItem(first: CartItem, second: CartItem): CartItem {
  const firstUnit = calculateHalfSideUnitPrice(first)
  const secondUnit = calculateHalfSideUnitPrice(second)
  const halfSize = first.size ?? second.size ?? 'half'

  return {
    ...first,
    id: `half-${first.id}-${second.id}`,
    name: 'Half & Half',
    size: halfSize,
    halfAndHalf: {
      first: {
        menuItemId: first.id,
        name: first.name,
        crust: first.crust,
        crustId: first.crustId,
        toppings: first.toppings,
      },
      second: {
        menuItemId: second.id,
        name: second.name,
        crust: second.crust,
        crustId: second.crustId,
        toppings: second.toppings,
      },
    },
    unitPrice: Math.max(firstUnit, secondUnit),
    toppings: undefined,
    crust: undefined,
    crustId: undefined,
    crustPrice: undefined,
    quantity: first.quantity,
  }
}

export function getCartItemDisplayName(item: CartItem): string {
  if (item.halfAndHalf) {
    return `Half & Half: ${item.halfAndHalf.first.name} / ${item.halfAndHalf.second.name}`
  }
  return item.name
}

export function formatHalfAndHalfOrderNote(item: CartItem): string | undefined {
  if (!item.halfAndHalf) return undefined
  const { first, second } = item.halfAndHalf
  const part = (side: CartHalfSide) => {
    const bits = [side.name]
    if (side.crust) bits.push(`crust: ${side.crust}`)
    if (side.toppings?.length) {
      bits.push(`toppings: ${side.toppings.map((t) => t.name).join(', ')}`)
    }
    return bits.join('; ')
  }
  return `Half & Half — 1st: ${part(first)} | 2nd: ${part(second)}`
}

/** Resolve half size key on a menu item (handles `half`, `half_pizza`, etc.). */
export function resolveHalfSizeKey(item: MenuItem): string | null {
  const match = item.sizes?.find((option) => isHalfMenuSize(option.size))
  return match ? normalizeMenuSizeKey(match.size) : null
}
