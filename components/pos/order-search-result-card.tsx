'use client'

import { MapPin, Phone, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { OrderSearchDisplay, OrderSearchLineDisplay } from '@/lib/order-search'
import type { OrderType, PaymentMethod } from '@/lib/pos-data'

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

function formatStatusLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatMoney(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `$${value.toFixed(2)}`
}

function DetailRow({
  label,
  value,
  muted = false,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <p className={`text-xs ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>
      <span className="font-medium text-foreground">{label}: </span>
      {value}
    </p>
  )
}

function OrderLineCard({ line }: { line: OrderSearchLineDisplay }) {
  const toppingSummary =
    line.toppings.length > 0
      ? line.toppings
          .map((t) => (t.price != null ? `${t.name} (+${formatMoney(t.price)})` : t.name))
          .join(', ')
      : 'None'

  return (
    <li className="rounded-lg border border-border bg-background/60 p-3 text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground wrap-break-word">{line.name}</p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {line.menuItemId != null ? `Menu item #${line.menuItemId}` : 'Menu item —'}
            {line.lineItemId != null ? ` · Line #${line.lineItemId}` : ''}
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium text-muted-foreground">
          ×{line.quantity}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {line.category ? (
          <Badge variant="secondary" className="text-[10px] capitalize">
            {line.category}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            Category unknown
          </Badge>
        )}
      </div>

      <div className="mt-2.5 space-y-0.5 rounded-md bg-secondary/40 px-2.5 py-2">
        <DetailRow label="Size" value={line.size ?? '—'} muted={!line.size} />
        <DetailRow label="Crust" value={line.crust ?? '—'} muted={!line.crust} />
        <DetailRow label="Toppings" value={toppingSummary} muted={line.toppings.length === 0} />
        {line.specialInstructions && (
          <DetailRow label="Instructions" value={line.specialInstructions} />
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-border/80 pt-2 text-[11px]">
        <span className="text-muted-foreground">Unit price</span>
        <span className="text-right font-medium">{formatMoney(line.unitPrice)}</span>
        <span className="text-muted-foreground">Toppings</span>
        <span className="text-right font-medium">{formatMoney(line.toppingsPrice)}</span>
        <span className="font-medium text-foreground">Line total</span>
        <span className="text-right font-semibold text-primary">
          {formatMoney(line.totalPrice)}
        </span>
      </div>
    </li>
  )
}

interface OrderSearchResultCardProps {
  order: OrderSearchDisplay
}

export function OrderSearchResultCard({ order }: OrderSearchResultCardProps) {
  const when = order.createdAt ? new Date(order.createdAt) : null
  const dateStr = when
    ? when.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null
  const timeStr = when
    ? when.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-card p-4 text-left shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Search result</p>
        <Badge variant={order.kotPrinted ? 'default' : 'outline'} className="text-xs">
          KOT {order.kotPrinted ? 'printed' : 'not printed'}
        </Badge>
      </div>

      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-semibold text-foreground">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            ID {order.id}
            {dateStr && timeStr ? ` · ${dateStr} · ${timeStr}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">${order.totalAmount.toFixed(2)}</p>
          <Badge variant="outline" className="mt-0.5 text-xs">
            {paymentLabels[order.paymentMethod]}
          </Badge>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge variant="secondary">{orderTypeLabels[order.orderType]}</Badge>
        <Badge variant="outline">{formatStatusLabel(order.status)}</Badge>
        <Badge variant="outline">{formatStatusLabel(order.paymentStatus)}</Badge>
      </div>

      <div className="space-y-2 rounded-lg bg-secondary/50 p-3 text-sm">
        <div className="flex items-start gap-2">
          <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium text-foreground">{order.customerName}</span>
        </div>
        {order.customerPhone !== '—' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-4 shrink-0" />
            <span>{order.customerPhone}</span>
          </div>
        )}
        {order.orderType === 'dine-in' && order.tableNumber && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Table: </span>
            {order.tableNumber}
          </p>
        )}
        {order.orderType === 'delivery' && order.deliveryAddress && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span className="whitespace-pre-wrap text-foreground">{order.deliveryAddress}</span>
          </div>
        )}
        {order.orderType === 'delivery' && order.deliveryInstructions && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Delivery notes: </span>
            {order.deliveryInstructions}
          </p>
        )}
      </div>

      {(order.comments || order.notes) && (
        <div className="mt-3 space-y-1 rounded-lg border border-border bg-background/60 p-2.5 text-sm">
          {order.comments && (
            <p>
              <span className="font-medium text-foreground">Comments: </span>
              <span className="text-muted-foreground whitespace-pre-wrap">{order.comments}</span>
            </p>
          )}
          {order.notes && (
            <p>
              <span className="font-medium text-foreground">Notes: </span>
              <span className="text-muted-foreground whitespace-pre-wrap">{order.notes}</span>
            </p>
          )}
        </div>
      )}

      {order.assignedEmployee && (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Cashier: </span>
          {order.assignedEmployee}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border pt-3 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax</span>
          <span>${order.taxAmount.toFixed(2)}</span>
        </div>
        {order.deliveryFee > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Delivery</span>
            <span>${order.deliveryFee.toFixed(2)}</span>
          </div>
        )}
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Discount{order.discountCode ? ` (${order.discountCode})` : ''}</span>
            <span>-${order.discountAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Menu items ordered
        </p>
        <ul className="space-y-2 text-xs text-foreground">
          {order.lines.length > 0 ? (
            order.lines.map((line, i) => <OrderLineCard key={line.lineItemId ?? i} line={line} />)
          ) : (
            <li className="text-muted-foreground">No items</li>
          )}
        </ul>
      </div>
    </div>
  )
}
