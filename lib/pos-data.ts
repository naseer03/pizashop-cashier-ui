export interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  categorySlug?: string
  categoryId?: number
  hasSizes?: boolean
  sizes?: MenuItemSizeOption[]
  description?: string | null
  image: string
  popular?: boolean
}

export interface MenuItemSizeOption {
  size: 'small' | 'medium' | 'large'
  price: number
  isDefault?: boolean
}

export interface CartItem extends MenuItem {
  quantity: number
  size?: 'small' | 'medium' | 'large'
  crust?: string
  crustId?: number
  crustPrice?: number
  toppings?: ToppingOption[]
  unitPrice?: number
}

export type OrderType = 'dine-in' | 'takeaway' | 'delivery'

export interface CustomerDetails {
  name: string
  phone: string
  /** Set for delivery orders */
  address?: string
  deliveryNotes?: string
}

export type PaymentMethod = 'cash' | 'card' | 'online'

export type DiscountType = 'percentage' | 'fixed'

export interface Discount {
  type: DiscountType
  value: number
  name?: string
}

export interface ApiCategory {
  id: number
  name: string
  slug: string
  description: string | null
  has_sizes: boolean
  display_order: number
  is_active: boolean
}

export interface ApiMenuItem {
  id: number
  name: string
  slug: string
  description: string | null
  category: {
    id: number
    name: string
    has_sizes: boolean
  }
  base_price: number
  sizes: Array<{
    size: string
    price: number
    is_default: boolean
  }>
  image_url: string | null
  is_available: boolean
  is_featured: boolean
}

export interface ApiTopping {
  id: number
  name: string
  price: number
  category?: {
    id: number
    name: string
  }
  is_available?: boolean
  is_active?: boolean
}

export interface ToppingOption {
  id: string
  name: string
  price: number
  categoryId?: number
  categoryName?: string
}

export interface ApiCrust {
  id: number
  name: string
  price: number
  /** Some API responses use a flat category id */
  category_id?: number
  category?: {
    id: number
    name: string
  } | null
  is_available?: boolean
  sort_order?: number
}

export interface CrustOption {
  id: string
  name: string
  price: number
}

export const presetDiscounts: Discount[] = [
  { type: 'percentage', value: 5, name: '5% Off' },
  { type: 'percentage', value: 10, name: '10% Off' },
  { type: 'percentage', value: 15, name: '15% Off' },
  { type: 'percentage', value: 20, name: '20% Off' },
  { type: 'fixed', value: 5, name: '$5 Off' },
  { type: 'fixed', value: 10, name: '$10 Off' },
]

export function calculateDiscountAmount(subtotal: number, discount: Discount): number {
  if (discount.type === 'percentage') {
    return subtotal * (discount.value / 100)
  }
  return Math.min(discount.value, subtotal) // Don't exceed subtotal
}

export interface MenuCategoryTab {
  value: string
  label: string
  icon: string
}

export const DEFAULT_MENU_CATEGORIES: MenuCategoryTab[] = [
  { value: 'all', label: 'All', icon: '📋' },
]

function normalizeCategory(name: string): string {
  const lowered = name.trim().toLowerCase()
  if (lowered.includes('pizza')) return 'pizza'
  if (lowered.includes('drink') || lowered.includes('beverage')) return 'drinks'
  if (lowered.includes('side')) return 'sides'
  if (lowered.includes('dessert') || lowered.includes('sweet')) return 'desserts'
  return lowered
}

function iconForCategory(name: string): string {
  const normalized = normalizeCategory(name)
  if (normalized === 'pizza') return '🍕'
  if (normalized === 'drinks') return '🥤'
  if (normalized === 'sides') return '🍟'
  if (normalized === 'desserts') return '🍰'
  return '🍽️'
}

function fallbackEmojiForCategory(name: string): string {
  const normalized = normalizeCategory(name)
  if (normalized === 'pizza') return '🍕'
  if (normalized === 'drinks') return '🥤'
  if (normalized === 'sides') return '🍟'
  if (normalized === 'desserts') return '🍰'
  return '🍴'
}

function toTitleCase(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function mapApiCategoriesToTabs(apiCategories: ApiCategory[]): MenuCategoryTab[] {
  const active = apiCategories
    .filter((cat) => cat.is_active)
    .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name))
    .map((cat) => ({
      value: cat.slug || normalizeCategory(cat.name),
      label: toTitleCase(cat.name),
      icon: iconForCategory(cat.name),
    }))

  return [{ value: 'all', label: 'All', icon: '📋' }, ...active]
}

export function mapApiMenuItems(apiItems: ApiMenuItem[]): MenuItem[] {
  return apiItems
    .filter((item) => item.is_available)
    .map((item) => {
      const normalizedCategory = normalizeCategory(item.category.name)
      const mappedSizes = item.sizes
        .map((size): MenuItemSizeOption | null => {
          const normalizedSize = size.size.trim().toLowerCase()
          if (normalizedSize !== 'small' && normalizedSize !== 'medium' && normalizedSize !== 'large') {
            return null
          }
          return {
            size: normalizedSize,
            price: size.price,
            isDefault: size.is_default,
          }
        })
        .filter((size): size is MenuItemSizeOption => size !== null)

      const defaultSize = mappedSizes.find((size) => size.isDefault) ?? mappedSizes[0]
      const price = defaultSize?.price ?? item.base_price

      return {
        id: String(item.id),
        name: item.name,
        price,
        category: normalizedCategory,
        categorySlug: item.category.name.trim().toLowerCase().replace(/\s+/g, '-'),
        categoryId: item.category.id,
        hasSizes: mappedSizes.length > 0,
        sizes: mappedSizes,
        description: item.description,
        image: fallbackEmojiForCategory(item.category.name),
        popular: item.is_featured,
      }
    })
}

export function mapApiToppings(apiToppings: ApiTopping[]): ToppingOption[] {
  const activeOrAll = apiToppings.filter(
    (topping) => topping.is_available !== false && topping.is_active !== false,
  )
  return activeOrAll.map((topping) => ({
    id: String(topping.id),
    name: topping.name,
    price: topping.price,
    categoryId: topping.category?.id,
    categoryName: topping.category?.name,
  }))
}

export const sizePrices = {
  small: 0,
  medium: 3,
  large: 6,
}

function crustCategoryId(crust: ApiCrust): number | undefined {
  return crust.category?.id ?? crust.category_id
}

/** Only crusts whose category id matches the menu item category (API-only; no fallback list). */
export function mapApiCrusts(apiCrusts: ApiCrust[], selectedCategoryId: number | undefined): CrustOption[] {
  if (selectedCategoryId == null) {
    return []
  }

  const available = apiCrusts
    .filter((crust) => crust.is_available !== false)
    .filter((crust) => {
      const cid = crustCategoryId(crust)
      return cid != null && cid === selectedCategoryId
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))

  return available.map((crust) => ({
    id: String(crust.id),
    name: crust.name,
    price: crust.price,
  }))
}

/** Decimal multiplier applied to taxable amount after discount (e.g. 0.05 → 5%). */
function num(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  return v
}

function rateFromTaxObject(obj: Record<string, unknown>): number | null {
  const dec =
    num(obj.tax_rate_decimal) ?? num(obj.rate_decimal) ?? num(obj.decimal_rate)
  if (dec !== null && dec >= 0 && dec <= 1) return dec

  const namedPercent =
    num(obj.tax_percentage) ?? num(obj.percentage) ?? num(obj.tax_percent) ?? num(obj.percent)
  if (namedPercent !== null && namedPercent >= 0) {
    return namedPercent > 1 ? namedPercent / 100 : namedPercent
  }

  const ambiguous = num(obj.tax_rate) ?? num(obj.rate)
  if (ambiguous !== null && ambiguous >= 0) {
    return ambiguous > 1 ? ambiguous / 100 : ambiguous
  }

  return null
}

/** Parses cashier `/v1/cashier/tax` JSON into a decimal tax rate for display and checkout. */
export function parseTaxRateDecimalFromCashierTaxApi(payload: unknown): number | null {
  if (payload === null || typeof payload !== 'object') return null

  const root = payload as Record<string, unknown>
  const rawData = root.data

  let candidates: Record<string, unknown>[] = []

  if (Array.isArray(rawData)) {
    candidates = rawData.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
  } else if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    const d = rawData as Record<string, unknown>
    if (Array.isArray(d.tax) || Array.isArray(d.taxes)) {
      const list = (d.tax ?? d.taxes) as unknown[]
      candidates = list.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    } else if (Array.isArray(d.tax_rates)) {
      const list = d.tax_rates as unknown[]
      candidates = list.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    } else {
      candidates = [d]
    }
  } else {
    candidates = [root]
  }

  const sorted = [...candidates].sort((a, b) => {
    const aOrd = typeof a.sort_order === 'number' ? a.sort_order : 0
    const bOrd = typeof b.sort_order === 'number' ? b.sort_order : 0
    return aOrd - bOrd
  })

  const rates: number[] = []
  for (const obj of sorted) {
    if (obj.is_active === false) continue
    const parsed = rateFromTaxObject(obj)
    if (parsed !== null && parsed >= 0) rates.push(parsed)
  }

  if (rates.length === 0) return null
  return rates.reduce((a, b) => a + b, 0)
}

export function calculateItemTotal(item: CartItem): number {
  let total = item.unitPrice ?? item.price
  
  if (item.size && !item.unitPrice) {
    total += sizePrices[item.size]
  }
  
  if (item.toppings) {
    const toppingsTotal = item.toppings.reduce((sum, topping) => {
      return sum + topping.price
    }, 0)
    total += toppingsTotal
  }

  if (item.crustPrice) {
    total += item.crustPrice
  }
  
  return total * item.quantity
}

export function generateOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`
}
