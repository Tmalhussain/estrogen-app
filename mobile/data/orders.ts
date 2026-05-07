import { Product, products } from './products';

export type OrderStatus =
  | 'placed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type OrderItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  status: OrderStatus;
  placedAt: string;
  estimatedDelivery: string;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  vat: number;
  total: number;
  address: string;
  driverName?: string;
  driverPhone?: string;
};

const subtotal = (items: OrderItem[]) =>
  items.reduce((s, i) => s + i.product.price * i.quantity, 0);

function build(
  id: string,
  status: OrderStatus,
  placedAt: string,
  itemSpecs: { id: string; q: number }[],
  address: string,
  estimatedDelivery: string,
  driver?: { name: string; phone: string }
): Order {
  const items: OrderItem[] = itemSpecs.map(({ id, q }) => ({
    product: products.find((p) => p.id === id)!,
    quantity: q,
  }));
  const sub = subtotal(items);
  const delivery = sub >= 100 ? 0 : 15;
  const vat = Math.round((sub + delivery) * 0.15);
  return {
    id,
    status,
    placedAt,
    estimatedDelivery,
    items,
    subtotal: sub,
    delivery,
    vat,
    total: sub + delivery + vat,
    address,
    driverName: driver?.name,
    driverPhone: driver?.phone,
  };
}

export const orders: Order[] = [
  build(
    'EST-2046',
    'out_for_delivery',
    'Today, 2:14 PM',
    [
      { id: 'p001', q: 1 },
      { id: 'p007', q: 1 },
    ],
    'Home — Al Olaya, Riyadh',
    'Today, 4:30–5:00 PM',
    { name: 'Sara A.', phone: '+966 50 ••• ••12' }
  ),
  build(
    'EST-2031',
    'preparing',
    'Today, 12:42 PM',
    [
      { id: 'p008', q: 2 },
      { id: 'p011', q: 1 },
    ],
    'Home — Al Olaya, Riyadh',
    'Today, 3:00–4:00 PM'
  ),
  build(
    'EST-2007',
    'delivered',
    'Yesterday, 10:18 AM',
    [
      { id: 'p005', q: 1 },
      { id: 'p012', q: 1 },
    ],
    'Home — Al Olaya, Riyadh',
    'Delivered yesterday at 12:42 PM',
    { name: 'Hala M.', phone: '+966 50 ••• ••84' }
  ),
  build(
    'EST-1988',
    'delivered',
    'May 2, 9:02 AM',
    [{ id: 'p010', q: 1 }],
    'Work — KAFD, Riyadh',
    'Delivered May 2 at 10:48 AM'
  ),
  build(
    'EST-1962',
    'cancelled',
    'Apr 28, 3:51 PM',
    [{ id: 'p006', q: 1 }],
    'Home — Al Olaya, Riyadh',
    'Cancelled by customer'
  ),
];

export const statusMeta: Record<
  OrderStatus,
  { label: string; tone: 'info' | 'success' | 'warning' | 'danger' }
> = {
  placed: { label: 'Placed', tone: 'info' },
  preparing: { label: 'Preparing', tone: 'warning' },
  out_for_delivery: { label: 'On the way', tone: 'info' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const trackingSteps: { key: OrderStatus; label: string; description: string }[] = [
  {
    key: 'placed',
    label: 'Order placed',
    description: 'We received your order and our pharmacist is reviewing it.',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    description: 'Our team is packing your order with care.',
  },
  {
    key: 'out_for_delivery',
    label: 'On the way',
    description: 'Your driver is heading to your address now.',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Enjoy! Tap reorder to get the same items again.',
  },
];
