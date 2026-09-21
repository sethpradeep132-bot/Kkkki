export type PortalId = 'customer' | 'seller' | 'hub' | 'rider' | 'admin';

export interface PortalItem {
  id: PortalId;
  orderNumber: number;
  iconName: string;
  nameEn: string;
  taglineEn: string;
  descriptionEn: string;
  badgeEn: string;
  accentColor: string;
  gradient: string;
  glowColor: string;
  keyStatsEn: string;
  featuresEn: string[];
  routePath: string;
  targetRole: string;
}

export interface Product {
  id: string;
  nameEn: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  image: string;
  inStock: boolean;
  hubLocation: string;
  badge?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: { productName: string; qty: number; price: number }[];
  totalAmount: number;
  status: 'Received' | 'Packed' | 'At Hub' | 'Out for Delivery' | 'Delivered';
  riderName?: string;
  eta: string;
  orderedAt: string;
}

export interface HubManifest {
  id: string;
  manifestNumber: string;
  originHub: string;
  destinationZone: string;
  totalParcels: number;
  status: 'In Sorting' | 'Dispatched' | 'Arrived' | 'Bay Staging';
  vehicleNumber: string;
  driverName: string;
  temperature?: string;
  eta: string;
}

export interface RiderTask {
  id: string;
  orderId: string;
  customerName: string;
  pickupLocation: string;
  dropAddress: string;
  distanceKm: number;
  estimatedMinutes: number;
  payout: number;
  status: 'Assigned' | 'Picked' | 'En Route' | 'Delivered';
  customerContact: string;
  paymentMode: 'Online Paid' | 'Cash on Delivery';
}
