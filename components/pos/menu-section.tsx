'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { getClientSession } from '@/lib/auth'
import {
  mapApiCrusts,
  DEFAULT_MENU_CATEGORIES,
  mapApiCategoriesToTabs,
  mapApiMenuItems,
  mapApiToppings,
  type ApiCategory,
  type ApiCrust,
  type ApiMenuItem,
  type ApiTopping,
  type MenuCategoryTab,
  type MenuItem,
  type CartItem,
  type ToppingOption,
} from '@/lib/pos-data'
import { CustomizationModal } from './customization-modal'

interface MenuSectionProps {
  searchQuery: string
  onAddToCart: (item: CartItem) => void
}

export function MenuSection({ searchQuery, onAddToCart }: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [categories, setCategories] = useState<MenuCategoryTab[]>(DEFAULT_MENU_CATEGORIES)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [toppings, setToppings] = useState<ToppingOption[]>([])
  const [apiCrusts, setApiCrusts] = useState<ApiCrust[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMenuAndCategories = async () => {
      const session = getClientSession()
      const token = session?.accessToken
      const tokenType = session?.tokenType || 'Bearer'
      if (!token) {
        setLoading(false)
        setLoadError('Missing cashier session. Please login again.')
        return
      }

      try {
        setLoading(true)
        setLoadError(null)

        const [categoriesRes, menuRes, toppingsRes, crustsRes] = await Promise.all([
          fetch('/api/categories', {
            headers: {
              Accept: 'application/json',
              Authorization: `${tokenType} ${token}`,
            },
            cache: 'no-store',
          }),
          fetch('/api/menu?only_available=true', {
            headers: {
              Accept: 'application/json',
              Authorization: `${tokenType} ${token}`,
            },
            cache: 'no-store',
          }),
          fetch('/api/toppings', {
            headers: {
              Accept: 'application/json',
              Authorization: `${tokenType} ${token}`,
            },
            cache: 'no-store',
          }),
          fetch('/api/crusts', {
            headers: {
              Accept: 'application/json',
              Authorization: `${tokenType} ${token}`,
            },
            cache: 'no-store',
          }),
        ])

        if (!categoriesRes.ok || !menuRes.ok) {
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
        let apiToppings: ApiTopping[] = []
        if (toppingsRes.ok) {
          const toppingsPayload = (await toppingsRes.json()) as
            | { success?: boolean; data?: { toppings?: ApiTopping[] } }
            | { toppings?: ApiTopping[] }
            | ApiTopping[]
          apiToppings = Array.isArray(toppingsPayload)
            ? toppingsPayload
            : toppingsPayload?.data?.toppings ?? toppingsPayload?.toppings ?? []
        }
        let loadedCrusts: ApiCrust[] = []
        if (crustsRes.ok) {
          const crustsPayload = (await crustsRes.json()) as
            | { success?: boolean; data?: { crusts?: ApiCrust[] } }
            | { crusts?: ApiCrust[] }
            | ApiCrust[]
          loadedCrusts = Array.isArray(crustsPayload)
            ? crustsPayload
            : crustsPayload?.data?.crusts ?? crustsPayload?.crusts ?? []
        }

        setCategories(mapApiCategoriesToTabs(apiCategories))
        setMenuItems(mapApiMenuItems(apiItems))
        setToppings(mapApiToppings(apiToppings))
        setApiCrusts(loadedCrusts)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to fetch menu data.'
        setLoadError(message)
        setCategories(DEFAULT_MENU_CATEGORIES)
        setMenuItems([])
        setToppings([])
        setApiCrusts([])
      } finally {
        setLoading(false)
      }
    }

    void fetchMenuAndCategories()
  }, [])

  const crustsForSelectedItem = useMemo(
    () => mapApiCrusts(apiCrusts, selectedItem?.categoryId),
    [apiCrusts, selectedItem?.categoryId],
  )

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
    const filtered = toppings.filter(
      (topping) => !topping.categoryId || topping.categoryId === item.categoryId,
    )
    if (filtered.length > 0) return filtered
    return toppings
  }

  const handleQuickAdd = (item: MenuItem) => {
    const itemToppings = getToppingsForItem(item)
    const hasApiToppings = itemToppings.some((t) => Number.isFinite(Number(t.id)))
    const crustsForItem = mapApiCrusts(apiCrusts, item.categoryId)
    const hasApiCrusts = crustsForItem.length > 0
    const shouldOpenCustomization = Boolean(item.hasSizes || hasApiToppings || hasApiCrusts)

    if (shouldOpenCustomization) {
      setSelectedItem(item)
    } else {
      onAddToCart({
        ...item,
        quantity: 1,
      })
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Quick Popular Items */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Star className="size-4 text-accent" />
          <span className="text-sm font-medium text-foreground">Quick Add</span>
        </div>
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

      {/* Customization Modal */}
      <CustomizationModal
        item={selectedItem}
        toppings={selectedItem ? getToppingsForItem(selectedItem) : toppings}
        crusts={crustsForSelectedItem}
        onClose={() => setSelectedItem(null)}
        onAdd={onAddToCart}
      />
    </div>
  )
}
