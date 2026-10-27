-- Devon Collection — starter catalogue. Safe to edit or delete everything from the admin dashboard afterwards.
-- Photos are from @devon_collection on Instagram (see public/images/CREDITS.md).

insert into public.categories (name, slug, tagline, description, image_url, sort_order, is_featured) values
  ('Signature Black', 'signature-black', 'The black abaya, perfected.',
   'Our house black in soft crepe and nidha — clean lines, hand-finished embroidery and details you notice up close.',
   '/images/sahar-classic.jpg', 1, true),
  ('Satin Open Abayas', 'satin', 'Fluid satin in colour.',
   'Light, open-front satin abayas that move beautifully — royal blue, fuchsia and sand.',
   '/images/rack.jpg', 2, true),
  ('Occasion', 'occasion', 'For Eid, weddings and evenings.',
   'Beading, lace and sheer sleeves for the moments that matter.',
   '/images/layal-beaded.jpg', 3, true);

with c as (select id, slug from public.categories)
insert into public.products (category_id, name, slug, description, details, product_type, price, compare_at_price, images, is_featured) values
  ((select id from c where slug = 'signature-black'), 'Noor Embroidered Abaya', 'noor-embroidered-abaya',
   'A black abaya with wide balloon sleeves, each one embroidered with a geometric panel in blush and gold thread. Paired with a matching shayla trimmed with tiny crystal flowers.',
   E'Premium crepe, with matching shayla\nHand embroidery on both sleeves\nDry clean only',
   'Embroidered', 890, null, array['/images/noor-embroidered.jpg'], true),
  ((select id from c where slug = 'signature-black'), 'Sahar Classic Abaya', 'sahar-classic-abaya',
   'Everyday black with a quiet twist: a fine lace trim runs down the front and along the sheer cuffs. Easy to wear from morning to evening.',
   E'Nidha fabric with lace trim\nSheer chiffon cuffs\nMatching shayla included\nGentle hand wash or dry clean',
   'Classic', 650, null, array['/images/sahar-classic.jpg'], true),
  ((select id from c where slug = 'satin'), 'Satin Open Abaya — Royal Blue', 'satin-open-abaya-royal-blue',
   'An open-front satin abaya in deep royal blue with a soft drape and a subtle sheen. Wear it over a slip dress or your favourite set.',
   E'Silk-touch satin\nOpen front, relaxed fit\nSteam on low heat',
   'Satin', 590, null, array['/images/satin-royal-blue.jpg', '/images/rack.jpg'], true),
  ((select id from c where slug = 'satin'), 'Satin Open Abaya — Fuchsia', 'satin-open-abaya-fuchsia',
   'Our signature colour. A vivid fuchsia satin abaya cut loose and open, made to be noticed.',
   E'Silk-touch satin\nOpen front, relaxed fit\nSteam on low heat',
   'Satin', 590, 690, array['/images/satin-fuchsia.jpg', '/images/rack.jpg'], false),
  ((select id from c where slug = 'satin'), 'Satin Open Abaya — Sand', 'satin-open-abaya-sand',
   'A warm sand satin abaya that pairs with everything — soft, light and easy for daytime.',
   E'Silk-touch satin\nOpen front, relaxed fit\nSteam on low heat',
   'Satin', 590, null, array['/images/satin-sand.jpg', '/images/rack.jpg'], false),
  ((select id from c where slug = 'occasion'), 'Layal Beaded Abaya', 'layal-beaded-abaya',
   'Black chiffon with sheer sleeves and a trail of hand-sewn crystal vines down the front. A statement piece for evenings and Eid.',
   E'Layered chiffon over crepe\nHand-sewn crystal and bead work\nMatching shayla included\nDry clean only',
   'Occasion', 1150, null, array['/images/layal-beaded.jpg', '/images/layal-detail.jpg'], true),
  ((select id from c where slug = 'occasion'), 'Lulu Ivory Lace Abaya', 'lulu-ivory-lace-abaya',
   'Soft ivory with scalloped gold lace framing the front and cuffs, worn over a satin inner dress. Made for weddings and celebrations.',
   E'Crepe with gold guipure lace\nSatin inner dress included\nDry clean only',
   'Occasion', 1290, null, array['/images/lulu-ivory-lace.jpg'], true);

-- Abayas are sized by length (inches, shoulder to hem).
insert into public.product_variants (product_id, size, color, sku, stock, sort_order)
select p.id, s.size, c.color, upper(replace(p.slug, '-abaya', '')) || '-' || s.size,
       case when s.size in ('52', '60') then 6 else 12 end, s.ord
from public.products p
join (values
  ('noor-embroidered-abaya', 'Black'),
  ('sahar-classic-abaya', 'Black'),
  ('satin-open-abaya-royal-blue', 'Royal Blue'),
  ('satin-open-abaya-fuchsia', 'Fuchsia'),
  ('satin-open-abaya-sand', 'Sand'),
  ('layal-beaded-abaya', 'Black'),
  ('lulu-ivory-lace-abaya', 'Ivory')
) as c(slug, color) on c.slug = p.slug
cross join (values ('52', 1), ('54', 2), ('56', 3), ('58', 4), ('60', 5)) as s(size, ord);

-- Coupons
insert into public.coupons (code, description, discount_type, value, min_order_amount, usage_limit) values
  ('WELCOME10', '10% off your first order', 'percent', 10, 0, null),
  ('EID100', 'AED 100 off orders over AED 1,000', 'fixed', 100, 1000, 200);

-- A few approved reviews so product pages don't start empty
insert into public.reviews (product_id, author_name, rating, title, body, status)
select id, r.name, r.rating, r.title, r.body, 'approved'
from public.products p
join (values
  ('noor-embroidered-abaya', 'Mariam S.', 5, 'Even better in person', 'The embroidery on the sleeves is so delicate. Everyone asked me where it was from.'),
  ('layal-beaded-abaya', 'Hessa A.', 5, 'Wore it for Eid', 'Beautiful beading and the chiffon is very light. Delivery to Abu Dhabi was quick.'),
  ('satin-open-abaya-fuchsia', 'Noura K.', 4, 'Gorgeous colour', 'The fuchsia is stunning. I sized down to 54 and it fits perfectly.')
) as r(slug, name, rating, title, body) on r.slug = p.slug;

-- Delivery: AED 30 flat, free over AED 500
update public.store_settings set shipping_flat = 30, free_shipping_threshold = 500 where id = 1;
