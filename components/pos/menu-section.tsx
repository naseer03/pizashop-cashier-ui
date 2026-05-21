'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cashierAuthFetch, handleAuthErrorFromResponse } from '@/lib/cashier-api'
import { getUpstreamErrorMessage } from '@/lib/upstream-fetch'
import {
  DEFAULT_MENU_CATEGORIES,
  getModifierCategoryIds,
  mapApiCategoriesToTabs,
  mapApiMenuItems,
  mapApiToppings,
  mapApiCrustsToOptions,
  parseCrustsFromApiPayload,
  parseToppingsFromApiPayload,
  type ApiCategory,
  type ApiMenuItem,
  type CrustOption,
  type MenuCategoryTab,
  type MenuItem,
  type CartItem,
  type ToppingOption,
} from '@/lib/pos-data'
import { CustomizationModal } from './customization-modal'
import { HalfSecondPickerModal } from './half-second-picker-modal'
import { buildHalfAndHalfCartItem } from '@/lib/half-and-half'

interface MenuSectionProps {
  searchQuery: string
  onAddToCart: (item: CartItem) => void
  /** Run after customer details are set (first menu tap). */
  ensureCustomerThen: (action: () => void) => void
}

export function MenuSection({ searchQuery, onAddToCart, ensureCustomerThen }: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [pendingHalfFirst, setPendingHalfFirst] = useState<CartItem | null>(null)
  const [halfSecondPickerOpen, setHalfSecondPickerOpen] = useState(false)
  const [secondHalfItem, setSecondHalfItem] = useState<MenuItem | null>(null)
  const [categories, setCategories] = useState<MenuCategoryTab[]>(DEFAULT_MENU_CATEGORIES)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [toppingsByCategoryId, setToppingsByCategoryId] = useState<
    Record<number, ToppingOption[]>
  >({})
  const [toppingsLoadingCategoryId, setToppingsLoadingCategoryId] = useState<number | null>(
    null,
  )
  const [toppingsErrorByCategoryId, setToppingsErrorByCategoryId] = useState<
    Record<number, string>
  >({})
  const [crustsByCategoryId, setCrustsByCategoryId] = useState<Record<number, CrustOption[]>>(
    {},
  )
  const [crustsLoadingCategoryId, setCrustsLoadingCategoryId] = useState<number | null>(null)
  const [crustsErrorByCategoryId, setCrustsErrorByCategoryId] = useState<Record<number, string>>(
    {},
  )
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const toppingsFetchStartedRef = useRef<Set<number>>(new Set())
  const crustsFetchStartedRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    const fetchMenuAndCategories = async () => {
      try {
        setLoading(true)
        setLoadError(null)

        const [categoriesRes, menuRes] = await Promise.all([
          cashierAuthFetch('/api/categories', { cache: 'no-store' }),
          cashierAuthFetch('/api/menu?only_available=true', { cache: 'no-store' }),
        ])

        if (!categoriesRes || !menuRes) {
          setLoading(false)
          return
        }

        if (!categoriesRes.ok || !menuRes.ok) {
          const failedRes = !categoriesRes.ok ? categoriesRes : menuRes
          try {
            const errBody = await failedRes.clone().json()
            if (handleAuthErrorFromResponse(failedRes.status, errBody)) {
              setLoading(false)
              return
            }
          } catch {
            // ignore parse errors
          }
          const categoryError = categoriesRes.ok
            ? null
            : `${categoriesRes.status} ${categoriesRes.statusText || 'categories error'}`
          const menuError = menuRes.ok ? null : `${menuRes.status} ${menuRes.statusText || 'menu error'}`
          throw new Error(
            `Failed to load menu data.${categoryError ? ` Categories: ${categoryError}.` : ''}${menuError ? ` Menu: ${menuError}.` : ''}`,
          )
        }

        const categoriesPayload = (await categoriesRes.json()) as {
          success?: boolean
          data?: { categories?: ApiCategory[] }
        }
        const menuPayload = (await menuRes.json()) as {
          success?: boolean
          data?: { items?: ApiMenuItem[] }
        }
        const apiCategories = categoriesPayload?.data?.categories ?? []
        const apiItems = menuPayload?.data?.items ?? []
        const modifierCategoryIds = getModifierCategoryIds(apiCategories)
        setCategories(mapApiCategoriesToTabs(apiCategories))
        setMenuItems(mapApiMenuItems(apiItems, modifierCategoryIds))
        setToppingsByCategoryId({})
        setCrustsByCategoryId({})
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to fetch menu data.'
        setLoadError(message)
        setCategories(DEFAULT_MENU_CATEGORIES)
        setMenuItems([])
        setToppingsByCategoryId({})
        setCrustsByCategoryId({})
      } finally {
        setLoading(false)
      }
    }

    void fetchMenuAndCategories()
  }, [])

  const loadToppingsForCategory = useCallback(async (categoryId: number) => {
    if (toppingsByCategoryId[categoryId] !== undefined) return
    if (toppingsFetchStartedRef.current.has(categoryId)) return
    toppingsFetchStartedRef.current.add(categoryId)

    setToppingsLoadingCategoryId(categoryId)
    setToppingsErrorByCategoryId((prev) => {
      const next = { ...prev }
      delete next[categoryId]
      return next
    })
    try {
      const res = await cashierAuthFetch(
        `/api/toppings?category_id=${categoryId}&is_available=true`,
        { cache: 'no-store' },
      )
      const json: unknown = res ? await res.json() : null

      if (!res?.ok) {
        const message =
          json &&
          typeof json === 'object' &&
          'message' in json &&
          typeof (json as { message: unknown }).message === 'string'
            ? (json as { message: string }).message
            : 'Failed to fetch toppings'
        setToppingsErrorByCategoryId((prev) => ({ ...prev, [categoryId]: message }))
        setToppingsByCategoryId((prev) => ({ ...prev, [categoryId]: [] }))
        return
      }

      const apiToppings = parseToppingsFromApiPayload(json)
      setToppingsByCategoryId((prev) => ({
        ...prev,
        [categoryId]: mapApiToppings(apiToppings),
      }))
    } catch {
      setToppingsErrorByCategoryId((prev) => ({
        ...prev,
        [categoryId]: 'Unable to fetch toppings',
      }))
      setToppingsByCategoryId((prev) => ({ ...prev, [categoryId]: [] }))
    } finally {
      setToppingsLoadingCategoryId((current) => (current === categoryId ? null : current))
    }
  }, [toppingsByCategoryId])

  useEffect(() => {
    if (selectedItem?.categoryId != null) {
      void loadToppingsForCategory(selectedItem.categoryId)
    }
  }, [selectedItem?.categoryId, loadToppingsForCategory])

  useEffect(() => {
    if (secondHalfItem?.categoryId != null) {
      void loadToppingsForCategory(secondHalfItem.categoryId)
    }
  }, [secondHalfItem?.categoryId, loadToppingsForCategory])

  const loadCrustsForCategory = useCallback(async (categoryId: number) => {
    if (crustsByCategoryId[categoryId] !== undefined) return
    if (crustsFetchStartedRef.current.has(categoryId)) return
    crustsFetchStartedRef.current.add(categoryId)

    setCrustsLoadingCategoryId(categoryId)
    setCrustsErrorByCategoryId((prev) => {
      const next = { ...prev }
      delete next[categoryId]
      return next
    })
    try {
      const res = await cashierAuthFetch(
        `/api/crusts?category_id=${categoryId}&is_available=true`,
        { cache: 'no-store' },
      )
      const json: unknown = res ? await res.json() : null

      if (!res?.ok) {
        const message =
          json &&
          typeof json === 'object' &&
          'message' in json &&
          typeof (json as { message: unknown }).message === 'string'
            ? (json as { message: string }).message
            : 'Failed to fetch crusts'
        setCrustsErrorByCategoryId((prev) => ({ ...prev, [categoryId]: message }))
        setCrustsByCategoryId((prev) => ({ ...prev, [categoryId]: [] }))
        return
      }

      const apiCrusts = parseCrustsFromApiPayload(json)
      setCrustsByCategoryId((prev) => ({
        ...prev,
        [categoryId]: mapApiCrustsToOptions(apiCrusts),
      }))
    } catch {
      setCrustsErrorByCategoryId((prev) => ({
        ...prev,
        [categoryId]: 'Unable to fetch crusts',
      }))
      setCrustsByCategoryId((prev) => ({ ...prev, [categoryId]: [] }))
    } finally {
      setCrustsLoadingCategoryId((current) => (current === categoryId ? null : current))
    }
  }, [crustsByCategoryId])

  useEffect(() => {
    if (selectedItem?.categoryId != null) {
      void loadCrustsForCategory(selectedItem.categoryId)
    }
  }, [selectedItem?.categoryId, loadCrustsForCategory])

  useEffect(() => {
    if (secondHalfItem?.categoryId != null) {
      void loadCrustsForCategory(secondHalfItem.categoryId)
    }
  }, [secondHalfItem?.categoryId, loadCrustsForCategory])

  const getCrustsForItem = (item: MenuItem): CrustOption[] => {
    if (item.categoryId == null) return []
    return crustsByCategoryId[item.categoryId] ?? []
  }

  const filteredItems = useMemo(
    () =>
      menuItems.filter((item) => {
        const matchesCategory =
          activeCategory === 'all' ||
          item.category === activeCategory ||
          item.categorySlug === activeCategory
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
      }),
    [activeCategory, menuItems, searchQuery],
  )

  const popularItems = useMemo(() => menuItems.filter((item) => item.popular), [menuItems])

  const getToppingsForItem = (item: MenuItem): ToppingOption[] => {
    if (item.categoryId == null) return []
    return toppingsByCategoryId[item.categoryId] ?? []
  }

  const selectedItemToppingsLoading =
    selectedItem?.categoryId != null &&
    toppingsLoadingCategoryId === selectedItem.categoryId

  const secondHalfToppingsLoading =
    secondHalfItem?.categoryId != null &&
    toppingsLoadingCategoryId === secondHalfItem.categoryId

  const selectedItemToppingsError =
    selectedItem?.categoryId != null
      ? toppingsErrorByCategoryId[selectedItem.categoryId]
      : undefined

  const secondHalfToppingsError =
    secondHalfItem?.categoryId != null
      ? toppingsErrorByCategoryId[secondHalfItem.categoryId]
      : undefined

  const selectedItemCrustsLoading =
    selectedItem?.categoryId != null &&
    crustsLoadingCategoryId === selectedItem.categoryId

  const secondHalfCrustsLoading =
    secondHalfItem?.categoryId != null &&
    crustsLoadingCategoryId === secondHalfItem.categoryId

  const selectedItemCrustsError =
    selectedItem?.categoryId != null
      ? crustsErrorByCategoryId[selectedItem.categoryId]
      : undefined

  const secondHalfCrustsError =
    secondHalfItem?.categoryId != null
      ? crustsErrorByCategoryId[secondHalfItem.categoryId]
      : undefined

  const resetHalfFlow = () => {
    setPendingHalfFirst(null)
    setHalfSecondPickerOpen(false)
    setSecondHalfItem(null)
  }

  const handleHalfFirstComplete = (draft: CartItem) => {
    setSelectedItem(null)
    setPendingHalfFirst(draft)
    setHalfSecondPickerOpen(true)
  }

  const handleSecondHalfPicked = (item: MenuItem) => {
    setHalfSecondPickerOpen(false)
    setSecondHalfItem(item)
  }

  const handleHalfSecondAdd = (secondDraft: CartItem) => {
    if (!pendingHalfFirst) return
    const merged = buildHalfAndHalfCartItem(pendingHalfFirst, secondDraft)
    onAddToCart(merged)
    resetHalfFlow()
    setSelectedItem(null)
    setSecondHalfItem(null)
  }

  const handleHalfPickerCancel = () => {
    resetHalfFlow()
  }

  const handleQuickAdd = (item: MenuItem) => {
    ensureCustomerThen(() => {
      if (item.categoryId != null) {
        void loadToppingsForCategory(item.categoryId)
        void loadCrustsForCategory(item.categoryId)
      }

      const shouldOpenCustomization = Boolean(item.hasSizes || item.categoryId != null)

      if (shouldOpenCustomization) {
        setSelectedItem(item)
      } else {
        onAddToCart({
          ...item,
          quantity: 1,
        })
      }
    })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Quick Popular Items */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-border shrink-0">
        {/* <div className="flex items-center gap-2 mb-2">
          <Star className="size-4 text-accent" />
          <span className="text-sm font-medium text-foreground">Quick Add</span>
        </div> */}
        <ScrollArea className="w-full min-w-0 max-w-full">
          <div className="flex gap-2 pb-1">
            {popularItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleQuickAdd(item)}
                className="shrink-0 px-2.5 sm:px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all flex items-center gap-2"
              >
                <span className="text-base sm:text-lg">{item.image}</span>
                <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">{item.name}</span>
                <Badge variant="outline" className="text-xs">${item.price.toFixed(2)}</Badge>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Category Tabs */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-border shrink-0">
        <ScrollArea className="w-full">
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                  activeCategory === category.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <span>{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        {loading && <p className="mt-2 text-xs text-muted-foreground">Loading menu...</p>}
        {!loading && loadError && <p className="mt-2 text-xs text-destructive">{loadError}</p>}
      </div>

      {/* Menu Grid */}
      <ScrollArea className="min-h-0 flex-1 basis-0">
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleQuickAdd(item)}
                className="group bg-card border border-border rounded-xl p-3 sm:p-4 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  {item.image}
                </div>
                <h3 className="font-semibold text-foreground text-xs sm:text-sm mb-1 line-clamp-1">{item.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold text-sm sm:text-base">${item.price.toFixed(2)}</span>
                  <div className="size-6 sm:size-7 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Plus className="size-3 sm:size-4" />
                  </div>
                </div>
                {item.popular && (
                  <Badge className="mt-2 bg-accent text-accent-foreground text-xs">Popular</Badge>
                )}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <span className="text-4xl mb-2">🔍</span>
              <p>No items found</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <CustomizationModal
        item={selectedItem}
        toppings={selectedItem ? getToppingsForItem(selectedItem) : []}
        toppingsLoading={selectedItemToppingsLoading}
        toppingsError={selectedItemToppingsError}
        crusts={selectedItem ? getCrustsForItem(selectedItem) : []}
        crustsLoading={selectedItemCrustsLoading}
        crustsError={selectedItemCrustsError}
        onClose={() => setSelectedItem(null)}
        onAdd={onAddToCart}
        onHalfSizeFirstComplete={handleHalfFirstComplete}
      />

      <CustomizationModal
        item={secondHalfItem}
        toppings={secondHalfItem ? getToppingsForItem(secondHalfItem) : []}
        toppingsLoading={secondHalfToppingsLoading}
        toppingsError={secondHalfToppingsError}
        crusts={secondHalfItem ? getCrustsForItem(secondHalfItem) : []}
        crustsLoading={secondHalfCrustsLoading}
        crustsError={secondHalfCrustsError}
        lockSizeToHalf
        onClose={() => {
          setSecondHalfItem(null)
          if (pendingHalfFirst) setHalfSecondPickerOpen(true)
        }}
        onAdd={handleHalfSecondAdd}
      />

      {pendingHalfFirst && (
        <HalfSecondPickerModal
          open={halfSecondPickerOpen}
          firstHalf={pendingHalfFirst}
          menuItems={menuItems}
          onSelect={handleSecondHalfPicked}
          onCancel={handleHalfPickerCancel}
        />
      )}
    </div>
  )
}
