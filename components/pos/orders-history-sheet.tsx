'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ClipboardList, Loader2, MapPin, Phone, Search, User } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { OrderSearchResultCard } from '@/components/pos/order-search-result-card'
import { cashierAuthFetch, handleAuthErrorFromResponse } from '@/lib/cashier-api'
import {
  filterOrdersByPeriod,
  loadOrders,
  type OrderPeriodFilter,
  type SavedOrder,
} from '@/lib/order-history'
import {
  buildMenuItemLookup,
  mapApiOrderSearchToDisplay,
  parseOrderSearchResponse,
  type OrderSearchDisplay,
} from '@/lib/order-search'
import type { ApiMenuItem } from '@/lib/pos-data'
import type { OrderType, PaymentMethod } from '@/lib/pos-data'

interface OrdersHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const orderTypeLabels: Record<OrderType, string> = {
  'dine-in': 'Dine In',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
}

const paymentLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  online: 'Online',
}

export function OrdersHistorySheet({ open, onOpenChange }: OrdersHistorySheetProps) {
  const [period, setPeriod] = useState<OrderPeriodFilter>('day')
  const [orders, setOrders] = useState<SavedOrder[]>([])
  const [orderIdQuery, setOrderIdQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResult, setSearchResult] = useState<OrderSearchDisplay | null>(null)

  const refresh = () => setOrders(loadOrders())

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!open) return
    refresh()
  }, [open])

  useEffect(() => {
    const onUpdate = () => refresh()
    window.addEventListener('pos-orders-updated', onUpdate)
    return () => window.removeEventListener('pos-orders-updated', onUpdate)
  }, [])

  const filtered = useMemo(
    () => filterOrdersByPeriod(orders, period),
    [orders, period],
  )

  const handleSearch = useCallback(async (e?: FormEvent) => {
    e?.preventDefault()
    const query = orderIdQuery.trim()
    if (!query) {
      setSearchError('Enter an order number (e.g. ORD-2026-001) or database ID (e.g. 82).')
      setSearchResult(null)
      return
    }

    setSearching(true)
    setSearchError(null)
    setSearchResult(null)

    try {
      const searchParams = new URLSearchParams()
      if (/^ORD-/i.test(query)) {
        searchParams.set('order_number', query)
      } else if (/^\d+$/.test(query)) {
        searchParams.set('order_id', query)
      } else {
        searchParams.set('order_number', query)
      }

      const response = await cashierAuthFetch(
        `/api/orders/search?${searchParams.toString()}`,
        { cache: 'no-store' },
      )

      if (!response) {
        setSearchError('Please sign in again to search orders.')
        return
      }

      let json: unknown = null
      try {
        json = await response.json()
      } catch {
        json = null
      }

      const parsed = parseOrderSearchResponse(json)

      if (!response.ok || !parsed.success || !parsed.data) {
        if (json && handleAuthErrorFromResponse(response.status, json)) return
        const message =
          parsed.message ||
          (response.status === 404 ? 'Order not found.' : 'Unable to find that order.')
        setSearchError(message)
        return
      }

      let menuLookup = undefined
      try {
        const menuRes = await cashierAuthFetch('/api/menu?only_available=false', {
          cache: 'no-store',
        })
        if (menuRes?.ok) {
          const menuJson = (await menuRes.json()) as {
            success?: boolean
            data?: { items?: ApiMenuItem[] }
          }
          const menuItems = menuJson?.data?.items ?? []
          if (menuItems.length > 0) {
            menuLookup = buildMenuItemLookup(menuItems)
          }
        }
      } catch {
        // Menu lookup is optional; order items still show API fields
      }

      setSearchResult(mapApiOrderSearchToDisplay(parsed.data, menuLookup))
    } catch (err) {
      const detail = err instanceof Error ? err.message : ''
      setSearchError(
        detail
          ? `Unable to search orders: ${detail}`
          : 'Unable to search orders right now. Please try again.',
      )
    } finally {
      setSearching(false)
    }
  }, [orderIdQuery])

  const clearSearch = useCallback(() => {
    setOrderIdQuery('')
    setSearchError(null)
    setSearchResult(null)
  }, [])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full min-h-0 w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="size-5 text-primary" />
            Orders
          </SheetTitle>
          <SheetDescription>
            Search by printed order number (e.g. ORD-2026-001) or database ID (e.g. 82).
          </SheetDescription>
        </SheetHeader>

        <div className="shrink-0 space-y-2 border-b border-border px-6 py-3">
          <p className="text-xs font-medium text-muted-foreground">Search order</p>
          <form onSubmit={(e) => void handleSearch(e)} className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={orderIdQuery}
                onChange={(e) => setOrderIdQuery(e.target.value)}
                placeholder="ORD-2026-001"
                className="h-9 pl-9"
                disabled={searching}
                aria-label="Order ID or order number"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 shrink-0 px-3" disabled={searching}>
              {searching ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                'Find'
              )}
            </Button>
          </form>
          {(searchResult || searchError) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={clearSearch}
            >
              Clear search
            </Button>
          )}
          {searchError && (
            <p className="text-xs text-destructive" role="alert">
              {searchError}
            </p>
          )}
        </div>

        <div className="shrink-0 border-b border-border px-6 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Local history</p>
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(v) => v && setPeriod(v as OrderPeriodFilter)}
            variant="outline"
            size="sm"
            className="w-full justify-stretch"
          >
            <ToggleGroupItem value="day" className="flex-1">
              Day
            </ToggleGroupItem>
            <ToggleGroupItem value="week" className="flex-1">
              Week
            </ToggleGroupItem>
            <ToggleGroupItem value="month" className="flex-1">
              Month
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <ScrollArea className="min-h-0 flex-1 basis-0">
          <div className="space-y-3 p-4 pr-2">
            {searchResult && <OrderSearchResultCard order={searchResult} />}

            {!searchResult && searching && (
              <p className="py-8 text-center text-sm text-muted-foreground">Searching…</p>
            )}

            {filtered.length === 0 && !searchResult && !searching ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No orders in this period on this device.
              </p>
            ) : (
              filtered.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </div>
        </ScrollArea>

        <div className="shrink-0 border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
          {searchResult ? 'Server order · ' : ''}
          {filtered.length} local order{filtered.length !== 1 ? 's' : ''} in period
        </div>
      </SheetContent>
    </Sheet>
  )
}

function OrderCard({ order }: { order: SavedOrder }) {
  const when = new Date(order.createdAt)
  const dateStr = when.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = when.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-left shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-semibold text-foreground">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {dateStr} · {timeStr}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">${order.total.toFixed(2)}</p>
          <Badge variant="outline" className="mt-0.5 text-xs">
            {paymentLabels[order.paymentMethod]}
          </Badge>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge
          variant="secondary"
          className={
            order.orderType === 'delivery'
              ? 'bg-primary/15 text-primary'
              : undefined
          }
        >
          {orderTypeLabels[order.orderType]}
        </Badge>
      </div>

      <div className="space-y-2 rounded-lg bg-secondary/50 p-3 text-sm">
        <div className="flex items-start gap-2">
          <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium text-foreground">{order.customer.name}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="size-4 shrink-0" />
          <span>{order.customer.phone}</span>
        </div>
        {order.orderType === 'delivery' && order.customer.address && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span className="whitespace-pre-wrap text-foreground">{order.customer.address}</span>
          </div>
        )}
        {order.orderType === 'delivery' && order.customer.deliveryNotes && (
          <p className="pl-6 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Notes: </span>
            {order.customer.deliveryNotes}
          </p>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Items</p>
        <ul className="space-y-1 text-xs text-foreground">
          {order.lines.map((line, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="min-w-0 truncate">{line.name}</span>
              <span className="shrink-0 text-muted-foreground">×{line.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
