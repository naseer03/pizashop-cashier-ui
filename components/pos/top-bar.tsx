'use client'

import {
  Search,
  LogOut,
  Wifi,
  WifiOff,
  Clock,
  Sun,
  Moon,
  Menu,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { OrderType } from '@/lib/pos-data'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { OrdersHistorySheet } from '@/components/pos/orders-history-sheet'

interface TopBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  orderType: OrderType
  setOrderType: (type: OrderType) => void
  onLogout?: () => void
}

export function TopBar({
  searchQuery,
  setSearchQuery,
  orderType,
  setOrderType,
  onLogout,
}: TopBarProps) {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [isOnline, setIsOnline] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [ordersOpen, setOrdersOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const orderTypes: { value: OrderType; label: string }[] = [
    { value: 'dine-in', label: 'Dine In' },
    { value: 'takeaway', label: 'Take' },
    { value: 'delivery', label: 'Delivery' },
  ]

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
      {/* Logo and Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl sm:text-2xl">🍕</span>
          <span className="font-bold text-base sm:text-lg text-foreground hidden md:inline">Pizza POS</span>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="hidden shrink-0 gap-1.5 px-3 sm:inline-flex"
          onClick={() => setOrdersOpen(true)}
        >
          <ClipboardList className="size-4" />
          Orders
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-9 shrink-0 sm:hidden"
          onClick={() => setOrdersOpen(true)}
          aria-label="Orders"
        >
          <ClipboardList className="size-4" />
        </Button>
        
        <div className="relative flex-1 max-w-xs sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 sm:h-10 pl-9 sm:pl-10 pr-3 sm:pr-4 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      </div>

      {/* Order Type Toggle - Desktop */}
      <div className="hidden sm:flex items-center bg-secondary rounded-lg p-1">
        {orderTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setOrderType(type.value)}
            className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
              orderType === type.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Right Side - Desktop */}
      <div className="hidden md:flex items-center gap-2 lg:gap-3">
        {/* Clock */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="size-4" />
          <span className="text-sm font-mono">{currentTime}</span>
        </div>

        {/* Online Status */}
        <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1">
          {isOnline ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
          <span className="hidden lg:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </Badge>

        {/* Theme Toggle */}
        {mounted && (
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}

        {/* Cashier Info */}
        <div className="hidden lg:flex items-center gap-2 text-sm">
          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
            JD
          </div>
          <span className="text-muted-foreground">John Doe</span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>

      <OrdersHistorySheet open={ordersOpen} onOpenChange={setOrdersOpen} />

      {/* Mobile Menu */}
      <div className="flex md:hidden items-center gap-2">
        {/* Theme Toggle */}
        {mounted && (
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="size-9 text-muted-foreground hover:text-foreground">
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9">
              <Menu className="size-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-4">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Order type selection and account options
            </SheetDescription>
            <div className="flex flex-col gap-6 pt-6">
              {/* Order Type */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Order Type</p>
                <div className="flex flex-col gap-1">
                  {orderTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setOrderType(type.value)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                        orderType === type.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={isOnline ? 'default' : 'destructive'} className="gap-1">
                    {isOnline ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time</span>
                  <span className="text-sm font-mono">{currentTime}</span>
                </div>
              </div>

              {/* Cashier */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  JD
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">John Doe</p>
                  <p className="text-xs text-muted-foreground">Cashier</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={onLogout}
                >
                  <LogOut className="size-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
