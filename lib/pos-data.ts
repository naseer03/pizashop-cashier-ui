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
  /** Normalized API size key (e.g. `small`, `extra_large`) */
  size: string
  price: number
  isDefault?: boolean
}

export interface CartHalfSide {
  menuItemId: string
  name: string
  crust?: string
  crustId?: number
  toppings?: ToppingOption[]
}

export interface HalfAndHalfData {
  first: CartHalfSide
  second: CartHalfSide
}

export interface CartItem extends MenuItem {
  quantity: number
  size?: string
  crust?: string
  crustId?: number
  crustPrice?: number
  toppings?: ToppingOption[]
  unitPrice?: number
  /** Two different menu items combined when size is half */
  halfAndHalf?: HalfAndHalfData
}

export type OrderType = 'dine-in' | 'takeaway' | 'delivery'

export interface CustomerDetails {
  name: string
  phone: string
  /** Set for delivery orders */
  address?: string
  deliveryNotes?: string
  /** Set for dine-in orders */
  tableNumber?: string
}

export interface CustomerFormState {
  name: string
  phone: string
  address: string
  deliveryNotes: string
  tableNumber: string
}

export const emptyCustomerForm = (): CustomerFormState => ({
  name: '',
  phone: '',
  address: '',
  deliveryNotes: '',
  tableNumber: '',
})

export function isCustomerFormValid(form: CustomerFormState, orderType: OrderType): boolean {
  if (!form.name.trim() || !form.phone.trim()) return false
  if (orderType === 'delivery' && !form.address.trim()) return false
  if (orderType === 'dine-in' && !form.tableNumber.trim()) return false
  return true
}

export function customerFormToDetails(form: CustomerFormState, orderType: OrderType): CustomerDetails {
  const base: CustomerDetails = {
    name: form.name.trim(),
    phone: form.phone.trim(),
  }
  if (orderType === 'dine-in' && form.tableNumber.trim()) {
    base.tableNumber = form.tableNumber.trim()
  }
  if (orderType === 'delivery') {
    base.address = form.address.trim()
    if (form.deliveryNotes.trim()) {
      base.deliveryNotes = form.deliveryNotes.trim()
    }
  }
  return base
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
  category_ids?: number[]
  categories?: Array<{ id: number; name: string }>
  is_available?: boolean
  is_active?: boolean
  sort_order?: number
}

export interface ApiToppingCategoryGroup {
  id: number
  name: string
  toppings?: ApiTopping[]
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

export interface ApiCrustCategoryGroup {
  id: number
  name: string
  crusts?: ApiCrust[]
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

/** Categories used only for toppings/crusts modifiers — not sellable menu products */
const MODIFIER_CATEGORY_KEYS = new Set([
  'topping',
  'toppings',
  'crust',
  'crusts',
  'modifier',
  'modifiers',
  'add-on',
  'add-ons',
  'addon',
  'addons',
  'extra',
  'extras',
])

export function isModifierCategory(name: string, slug?: string | null): boolean {
  const normalizedName = name.trim().toLowerCase().replace(/[\s_]+/g, '-')
  const normalizedSlug = (slug ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-')
  return (
    MODIFIER_CATEGORY_KEYS.has(normalizedName) ||
    MODIFIER_CATEGORY_KEYS.has(normalizedSlug) ||
    /^toppings?$/.test(normalizedName) ||
    /^crusts?$/.test(normalizedName) ||
    /^toppings?$/.test(normalizedSlug) ||
    /^crusts?$/.test(normalizedSlug)
  )
}

export function getModifierCategoryIds(categories: ApiCategory[]): Set<number> {
  return new Set(
    categories
      .filter((cat) => isModifierCategory(cat.name, cat.slug))
      .map((cat) => cat.id),
  )
}

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

export function normalizeMenuSizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

export function formatMenuSizeLabel(sizeKey: string): string {
  return sizeKey
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function isHalfMenuSize(sizeKey: string | undefined): boolean {
  if (!sizeKey) return false
  const normalized = normalizeMenuSizeKey(sizeKey)
  return normalized === 'half' || normalized.endsWith('_half') || normalized.startsWith('half_')
}

const DISPLAY_SIZE_ORDER: Record<string, number> = {
  small: 0,
  medium: 1,
  large: 2,
  extra_large: 3,
  xlarge: 3,
}

function sortMenuSizesForDisplay(sizes: MenuItemSizeOption[]): MenuItemSizeOption[] {
  return [...sizes].sort((a, b) => {
    const ra = DISPLAY_SIZE_ORDER[a.size] ?? 50
    const rb = DISPLAY_SIZE_ORDER[b.size] ?? 50
    if (ra !== rb) return ra - rb
    return a.size.localeCompare(b.size)
  })
}

export function mapApiCategoriesToTabs(apiCategories: ApiCategory[]): MenuCategoryTab[] {
  const active = apiCategories
    .filter((cat) => cat.is_active)
    .filter((cat) => !isModifierCategory(cat.name, cat.slug))
    .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name))
    .map((cat) => ({
      value: cat.slug || normalizeCategory(cat.name),
      label: toTitleCase(cat.name),
      icon: iconForCategory(cat.name),
    }))

  return [{ value: 'all', label: 'All', icon: '📋' }, ...active]
}

export function mapApiMenuItems(
  apiItems: ApiMenuItem[],
  modifierCategoryIds?: Set<number>,
): MenuItem[] {
  return apiItems
    .filter((item) => item.is_available)
    .filter((item) => !isModifierCategory(item.category.name))
    .filter(
      (item) =>
        !modifierCategoryIds ||
        modifierCategoryIds.size === 0 ||
        !modifierCategoryIds.has(item.category.id),
    )
    .map((item) => {
      const normalizedCategory = normalizeCategory(item.category.name)
      const mappedSizes = sortMenuSizesForDisplay(
        item.sizes
          .map((size): MenuItemSizeOption | null => {
            const normalizedSize = normalizeMenuSizeKey(size.size)
            if (!normalizedSize) return null
            return {
              size: normalizedSize,
              price: size.price,
              isDefault: size.is_default,
            }
          })
          .filter((size): size is MenuItemSizeOption => size !== null),
      )

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

function toppingCategoryId(topping: ApiTopping): number | undefined {
  return topping.category?.id ?? topping.categories?.[0]?.id ?? topping.category_ids?.[0]
}

function toppingCategoryName(topping: ApiTopping): string | undefined {
  return topping.category?.name ?? topping.categories?.[0]?.name
}

/** Flattens grouped `data.categories[].toppings` or legacy flat `data.toppings` lists. */
export function parseToppingsFromApiPayload(payload: unknown): ApiTopping[] {
  if (!payload || typeof payload !== 'object') return []

  const root = payload as Record<string, unknown>

  if (Array.isArray(root)) {
    return root as ApiTopping[]
  }

  const data = root.data
  if (!data || typeof data !== 'object') {
    if (Array.isArray(root.toppings)) return root.toppings as ApiTopping[]
    return []
  }

  const dataRecord = data as Record<string, unknown>

  if (Array.isArray(dataRecord.toppings)) {
    return dataRecord.toppings as ApiTopping[]
  }

  if (Array.isArray(dataRecord.categories)) {
    const groups = dataRecord.categories as ApiToppingCategoryGroup[]
    const flat: ApiTopping[] = []
    for (const group of groups) {
      const groupId = group.id
      const groupName = group.name
      for (const topping of group.toppings ?? []) {
        flat.push({
          ...topping,
          category_ids: topping.category_ids ?? (groupId != null ? [groupId] : undefined),
          categories:
            topping.categories ??
            (groupId != null && groupName
              ? [{ id: groupId, name: groupName }]
              : undefined),
        })
      }
    }
    return flat
  }

  return []
}

export function mapApiToppings(apiToppings: ApiTopping[]): ToppingOption[] {
  const activeOrAll = apiToppings.filter(
    (topping) => topping.is_available !== false && topping.is_active !== false,
  )

  return [...activeOrAll]
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
    )
    .map((topping) => ({
      id: String(topping.id),
      name: topping.name,
      price: topping.price,
      categoryId: toppingCategoryId(topping),
      categoryName: toppingCategoryName(topping),
    }))
}

function crustCategoryId(crust: ApiCrust): number | undefined {
  return crust.category?.id ?? crust.category_id
}

/** Flattens grouped `data.categories[].crusts` or legacy flat `data.crusts` lists. */
export function parseCrustsFromApiPayload(payload: unknown): ApiCrust[] {
  if (!payload || typeof payload !== 'object') return []

  const root = payload as Record<string, unknown>

  if (Array.isArray(root)) {
    return root as ApiCrust[]
  }

  const data = root.data
  if (!data || typeof data !== 'object') {
    if (Array.isArray(root.crusts)) return root.crusts as ApiCrust[]
    return []
  }

  const dataRecord = data as Record<string, unknown>

  if (Array.isArray(dataRecord.crusts)) {
    return dataRecord.crusts as ApiCrust[]
  }

  if (Array.isArray(dataRecord.categories)) {
    const groups = dataRecord.categories as ApiCrustCategoryGroup[]
    const flat: ApiCrust[] = []
    for (const group of groups) {
      const groupId = group.id
      const groupName = group.name
      for (const crust of group.crusts ?? []) {
        flat.push({
          ...crust,
          category_id: crust.category_id ?? groupId,
          category:
            crust.category ??
            (groupId != null && groupName ? { id: groupId, name: groupName } : null),
        })
      }
    }
    return flat
  }

  return []
}

export function mapApiCrustsToOptions(apiCrusts: ApiCrust[]): CrustOption[] {
  return [...apiCrusts]
    .filter((crust) => crust.is_available !== false)
    .sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
    )
    .map((crust) => ({
      id: String(crust.id),
      name: crust.name,
      price: crust.price,
    }))
}

/** Only crusts whose category id matches the menu item category (client-side filter). */
export function mapApiCrusts(
  apiCrusts: ApiCrust[],
  selectedCategoryId: number | undefined,
): CrustOption[] {
  if (selectedCategoryId == null) {
    return []
  }

  const filtered = apiCrusts.filter((crust) => {
    const cid = crustCategoryId(crust)
    return cid != null && cid === selectedCategoryId
  })

  return mapApiCrustsToOptions(filtered)
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
  if (item.halfAndHalf && item.unitPrice != null) {
    return item.unitPrice * item.quantity
  }

  let total: number
  if (item.unitPrice != null) {
    total = item.unitPrice
  } else if (item.size && item.sizes && item.sizes.length > 0) {
    const match = item.sizes.find((s) => s.size === item.size)
    total = match?.price ?? item.price
  } else {
    total = item.price
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
