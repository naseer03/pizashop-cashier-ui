'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, MapPin, Phone, User } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  filterOrdersByPeriod,
  loadOrders,
  type OrderPeriodFilter,
  type SavedOrder,
} from '@/lib/order-history'
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
            Completed orders with customer details. Filter by time range.
          </SheetDescription>
        </SheetHeader>

        <div className="shrink-0 border-b border-border px-6 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Show</p>
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
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No orders in this period.
              </p>
            ) : (
              filtered.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </ScrollArea>

        <div className="shrink-0 border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
          {filtered.length} order{filtered.length !== 1 ? 's' : ''} · Stored on this device only
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
