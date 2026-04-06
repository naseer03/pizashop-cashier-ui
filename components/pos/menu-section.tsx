'use client'

import { useState } from 'react'
import { Plus, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { menuItems, type MenuItem, type CartItem } from '@/lib/pos-data'
import { CustomizationModal } from './customization-modal'

interface MenuSectionProps {
  searchQuery: string
  onAddToCart: (item: CartItem) => void
}

type Category = 'all' | 'pizza' | 'drinks' | 'sides' | 'desserts'

const categories: { value: Category; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'pizza', label: 'Pizza', icon: '🍕' },
  { value: 'drinks', label: 'Drinks', icon: '🥤' },
  { value: 'sides', label: 'Sides', icon: '🍟' },
  { value: 'desserts', label: 'Desserts', icon: '🍰' },
]

export function MenuSection({ searchQuery, onAddToCart }: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const popularItems = menuItems.filter(item => item.popular)

  const handleQuickAdd = (item: MenuItem) => {
    if (item.category === 'pizza') {
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
                className="flex-shrink-0 px-2.5 sm:px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border transition-all flex items-center gap-2"
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
        onClose={() => setSelectedItem(null)}
        onAdd={onAddToCart}
      />
    </div>
  )
}
