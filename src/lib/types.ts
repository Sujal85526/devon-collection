export type Category = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Variant = {
  id: string;
  product_id: string;
  size: string;
  color: string | null;
  sku: string | null;
  stock: number;
  low_stock_threshold: number;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  details: string | null;
  product_type: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductWithRelations = Product & {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  variants: Variant[];
};

export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  author_email: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  admin_reply: string | null;
  created_at: string;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type ShippingAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  emirate?: string;
  country?: string;
  notes?: string;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  shipping_address: ShippingAddress;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  total: number;
  coupon_code: string | null;
  currency: string;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_provider: string | null;
  status: OrderStatus;
  tracking_number: string | null;
  carrier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type OrderEvent = {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_at: string;
};
