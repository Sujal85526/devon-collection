/** Contact details from the @devon_collection Instagram profile. */
export const BRAND = {
  name: "Devon Collection",
  tagline: "Luxury in Each Detail",
  instagram: "https://www.instagram.com/devon_collection/",
  instagramHandle: "@devon_collection",
  whatsapp: "971561102881",
  phoneDisplay: "+971 56 110 2881",
} as const;

export const whatsappLink = (text?: string) =>
  `https://wa.me/${BRAND.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
