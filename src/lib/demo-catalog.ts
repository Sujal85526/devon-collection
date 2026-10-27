import type { Category, ProductWithRelations, Review } from "@/lib/types";

/**
 * The starter catalogue from supabase/seed.sql, served when no Supabase project is configured
 * (e.g. a preview deploy) so the storefront still shows the collection. Ordering is switched off
 * in that mode; once NEXT_PUBLIC_SUPABASE_URL is set, everything comes from the database.
 */

const CREATED = "2026-10-01T00:00:00.000Z";

const cat = (n: number, slug: string, name: string, tagline: string, description: string, image_url: string): Category => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  name,
  slug,
  tagline,
  description,
  image_url,
  sort_order: n,
  is_featured: true,
  is_active: true,
  created_at: CREATED,
  updated_at: CREATED,
});

export const DEMO_CATEGORIES: Category[] = [
  cat(1, "signature-black", "Signature Black", "The black abaya, perfected.",
    "Our house black in soft crepe and nidha — clean lines, hand-finished embroidery and details you notice up close.", "/images/sahar-classic.jpg"),
  cat(2, "satin", "Satin Open Abayas", "Fluid satin in colour.",
    "Light, open-front satin abayas that move beautifully — royal blue, fuchsia and sand.", "/images/rack.jpg"),
  cat(3, "occasion", "Occasion", "For Eid, weddings and evenings.",
    "Beading, lace and sheer sleeves for the moments that matter.", "/images/layal-beaded.jpg"),
];

type Seed = {
  slug: string;
  name: string;
  category: string;
  type: string;
  price: number;
  compare?: number;
  color: string;
  images: string[];
  featured: boolean;
  description: string;
  details: string;
};

const SATIN_DETAILS = "Silk-touch satin\nOpen front, relaxed fit\nSteam on low heat";

const SEEDS: Seed[] = [
  {
    slug: "noor-embroidered-abaya", name: "Noor Embroidered Abaya", category: "signature-black", type: "Embroidered", price: 890, color: "Black",
    images: ["/images/noor-embroidered.jpg"], featured: true,
    description: "A black abaya with wide balloon sleeves, each one embroidered with a geometric panel in blush and gold thread. Paired with a matching shayla trimmed with tiny crystal flowers.",
    details: "Premium crepe, with matching shayla\nHand embroidery on both sleeves\nDry clean only",
  },
  {
    slug: "sahar-classic-abaya", name: "Sahar Classic Abaya", category: "signature-black", type: "Classic", price: 650, color: "Black",
    images: ["/images/sahar-classic.jpg"], featured: true,
    description: "Everyday black with a quiet twist: a fine lace trim runs down the front and along the sheer cuffs. Easy to wear from morning to evening.",
    details: "Nidha fabric with lace trim\nSheer chiffon cuffs\nMatching shayla included\nGentle hand wash or dry clean",
  },
  {
    slug: "satin-open-abaya-royal-blue", name: "Satin Open Abaya — Royal Blue", category: "satin", type: "Satin", price: 590, color: "Royal Blue",
    images: ["/images/satin-royal-blue.jpg", "/images/rack.jpg"], featured: true,
    description: "An open-front satin abaya in deep royal blue with a soft drape and a subtle sheen. Wear it over a slip dress or your favourite set.",
    details: SATIN_DETAILS,
  },
  {
    slug: "satin-open-abaya-fuchsia", name: "Satin Open Abaya — Fuchsia", category: "satin", type: "Satin", price: 590, compare: 690, color: "Fuchsia",
    images: ["/images/satin-fuchsia.jpg", "/images/rack.jpg"], featured: false,
    description: "Our signature colour. A vivid fuchsia satin abaya cut loose and open, made to be noticed.",
    details: SATIN_DETAILS,
  },
  {
    slug: "satin-open-abaya-sand", name: "Satin Open Abaya — Sand", category: "satin", type: "Satin", price: 590, color: "Sand",
    images: ["/images/satin-sand.jpg", "/images/rack.jpg"], featured: false,
    description: "A warm sand satin abaya that pairs with everything — soft, light and easy for daytime.",
    details: SATIN_DETAILS,
  },
  {
    slug: "layal-beaded-abaya", name: "Layal Beaded Abaya", category: "occasion", type: "Occasion", price: 1150, color: "Black",
    images: ["/images/layal-beaded.jpg", "/images/layal-detail.jpg"], featured: true,
    description: "Black chiffon with sheer sleeves and a trail of hand-sewn crystal vines down the front. A statement piece for evenings and Eid.",
    details: "Layered chiffon over crepe\nHand-sewn crystal and bead work\nMatching shayla included\nDry clean only",
  },
  {
    slug: "lulu-ivory-lace-abaya", name: "Lulu Ivory Lace Abaya", category: "occasion", type: "Occasion", price: 1290, color: "Ivory",
    images: ["/images/lulu-ivory-lace.jpg"], featured: true,
    description: "Soft ivory with scalloped gold lace framing the front and cuffs, worn over a satin inner dress. Made for weddings and celebrations.",
    details: "Crepe with gold guipure lace\nSatin inner dress included\nDry clean only",
  },
];

const SIZES = ["52", "54", "56", "58", "60"];
const hex = (n: number) => n.toString(16).padStart(12, "0");

// Newest first, like the database default sort (later seeds get later timestamps).
export const DEMO_PRODUCTS: ProductWithRelations[] = SEEDS.map((s, i) => {
  const id = `10000000-0000-4000-8000-${hex(i + 1)}`;
  const category = DEMO_CATEGORIES.find((c) => c.slug === s.category)!;
  const created = new Date(Date.parse(CREATED) + i * 60_000).toISOString();
  return {
    id,
    category_id: category.id,
    category: { id: category.id, name: category.name, slug: category.slug },
    name: s.name,
    slug: s.slug,
    description: s.description,
    details: s.details,
    product_type: s.type,
    price: s.price,
    compare_at_price: s.compare ?? null,
    images: s.images,
    is_active: true,
    is_featured: s.featured,
    created_at: created,
    updated_at: created,
    variants: SIZES.map((size, j) => ({
      id: `20000000-0000-4000-8000-${hex((i + 1) * 10 + j)}`,
      product_id: id,
      size,
      color: s.color,
      sku: `${s.slug.replace(/-abaya/, "").toUpperCase()}-${size}`,
      stock: size === "52" || size === "60" ? 6 : 12,
      low_stock_threshold: 5,
      sort_order: j + 1,
    })),
  };
}).reverse();

const review = (slug: string, author_name: string, rating: number, title: string, body: string): Review => ({
  id: `30000000-0000-4000-8000-${hex(slug.length + rating)}`,
  product_id: DEMO_PRODUCTS.find((p) => p.slug === slug)!.id,
  user_id: null,
  author_name,
  author_email: null,
  rating,
  title,
  body,
  status: "approved",
  admin_reply: null,
  created_at: CREATED,
});

export const DEMO_REVIEWS: Review[] = [
  review("noor-embroidered-abaya", "Mariam S.", 5, "Even better in person", "The embroidery on the sleeves is so delicate. Everyone asked me where it was from."),
  review("layal-beaded-abaya", "Hessa A.", 5, "Wore it for Eid", "Beautiful beading and the chiffon is very light. Delivery to Abu Dhabi was quick."),
  review("satin-open-abaya-fuchsia", "Noura K.", 4, "Gorgeous colour", "The fuchsia is stunning. I sized down to 54 and it fits perfectly."),
];
