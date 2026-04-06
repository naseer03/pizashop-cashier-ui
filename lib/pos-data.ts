export interface MenuItem {
  id: string
  name: string
  price: number
  category: 'pizza' | 'drinks' | 'sides' | 'desserts'
  image: string
  popular?: boolean
}

export interface CartItem extends MenuItem {
  quantity: number
  size?: 'small' | 'medium' | 'large'
  crust?: 'thin' | 'regular' | 'thick' | 'stuffed'
  toppings?: string[]
}

export type OrderType = 'dine-in' | 'takeaway' | 'delivery'

export interface CustomerDetails {
  name: string
  phone: string
  /** Set for delivery orders */
  address?: string
  deliveryNotes?: string
}

export type PaymentMethod = 'cash' | 'card' | 'upi'

export type DiscountType = 'percentage' | 'fixed'

export interface Discount {
  type: DiscountType
  value: number
  name?: string
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

export const menuItems: MenuItem[] = [
  // Pizzas
  { id: 'p1', name: 'Margherita', price: 12.99, category: 'pizza', image: '🍕', popular: true },
  { id: 'p2', name: 'Pepperoni', price: 14.99, category: 'pizza', image: '🍕', popular: true },
  { id: 'p3', name: 'BBQ Chicken', price: 15.99, category: 'pizza', image: '🍕', popular: true },
  { id: 'p4', name: 'Veggie Supreme', price: 13.99, category: 'pizza', image: '🍕' },
  { id: 'p5', name: 'Hawaiian', price: 14.99, category: 'pizza', image: '🍕' },
  { id: 'p6', name: 'Meat Lovers', price: 16.99, category: 'pizza', image: '🍕' },
  { id: 'p7', name: 'Four Cheese', price: 14.99, category: 'pizza', image: '🍕' },
  { id: 'p8', name: 'Buffalo Chicken', price: 15.99, category: 'pizza', image: '🍕' },
  
  // Drinks
  { id: 'd1', name: 'Coca-Cola', price: 2.99, category: 'drinks', image: '🥤', popular: true },
  { id: 'd2', name: 'Sprite', price: 2.99, category: 'drinks', image: '🥤' },
  { id: 'd3', name: 'Fanta', price: 2.99, category: 'drinks', image: '🥤' },
  { id: 'd4', name: 'Lemonade', price: 3.49, category: 'drinks', image: '🍋' },
  { id: 'd5', name: 'Iced Tea', price: 3.49, category: 'drinks', image: '🧋' },
  { id: 'd6', name: 'Water', price: 1.99, category: 'drinks', image: '💧' },
  
  // Sides
  { id: 's1', name: 'Garlic Bread', price: 4.99, category: 'sides', image: '🥖', popular: true },
  { id: 's2', name: 'Chicken Wings', price: 8.99, category: 'sides', image: '🍗' },
  { id: 's3', name: 'Mozzarella Sticks', price: 6.99, category: 'sides', image: '🧀' },
  { id: 's4', name: 'Caesar Salad', price: 7.99, category: 'sides', image: '🥗' },
  { id: 's5', name: 'Onion Rings', price: 5.99, category: 'sides', image: '🧅' },
  { id: 's6', name: 'Loaded Fries', price: 6.99, category: 'sides', image: '🍟' },
  
  // Desserts
  { id: 'de1', name: 'Chocolate Brownie', price: 5.99, category: 'desserts', image: '🍫', popular: true },
  { id: 'de2', name: 'Tiramisu', price: 6.99, category: 'desserts', image: '🍰' },
  { id: 'de3', name: 'Ice Cream', price: 4.99, category: 'desserts', image: '🍨' },
  { id: 'de4', name: 'Cheesecake', price: 6.99, category: 'desserts', image: '🧁' },
]

export const extraToppings = [
  { id: 't1', name: 'Extra Cheese', price: 2.00 },
  { id: 't2', name: 'Pepperoni', price: 1.50 },
  { id: 't3', name: 'Mushrooms', price: 1.00 },
  { id: 't4', name: 'Olives', price: 1.00 },
  { id: 't5', name: 'Onions', price: 0.75 },
  { id: 't6', name: 'Bell Peppers', price: 1.00 },
  { id: 't7', name: 'Jalapeños', price: 0.75 },
  { id: 't8', name: 'Bacon', price: 1.75 },
]

export const sizePrices = {
  small: 0,
  medium: 3,
  large: 6,
}

export const crustTypes = ['thin', 'regular', 'thick', 'stuffed'] as const

export const TAX_RATE = 0.08

export function calculateItemTotal(item: CartItem): number {
  let total = item.price
  
  if (item.size) {
    total += sizePrices[item.size]
  }
  
  if (item.toppings) {
    const toppingsTotal = item.toppings.reduce((sum, toppingId) => {
      const topping = extraToppings.find(t => t.id === toppingId)
      return sum + (topping?.price || 0)
    }, 0)
    total += toppingsTotal
  }
  
  return total * item.quantity
}

export function generateOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`
}
