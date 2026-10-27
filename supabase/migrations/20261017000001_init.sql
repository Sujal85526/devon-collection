-- Devon Collection — initial schema
-- Catalog (categories, products, variants), reviews, coupons, orders, admin roles.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- Profiles & roles
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Customers may edit their own profile but never their role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ─────────────────────────────────────────────────────────────
-- Shared updated_at trigger
-- ─────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Catalog
-- ─────────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tagline text,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  details text,
  product_type text,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  images text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text not null default 'One Size',
  color text,
  sku text unique,
  stock int not null default 0 check (stock >= 0),
  low_stock_threshold int not null default 5,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_variants_product_idx on public.product_variants (product_id);
create trigger product_variants_touch before update on public.product_variants
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Reviews
-- ─────────────────────────────────────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  author_email text,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_reply text,
  created_at timestamptz not null default now()
);

create index reviews_product_idx on public.reviews (product_id, status);

-- ─────────────────────────────────────────────────────────────
-- Coupons
-- ─────────────────────────────────────────────────────────────
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code)),
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  value numeric(10, 2) not null check (value > 0),
  min_order_amount numeric(10, 2) not null default 0,
  max_discount numeric(10, 2),
  usage_limit int,
  used_count int not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger coupons_touch before update on public.coupons
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Store settings (single row)
-- ─────────────────────────────────────────────────────────────
create table public.store_settings (
  id int primary key default 1 check (id = 1),
  shipping_flat numeric(10, 2) not null default 25,
  free_shipping_threshold numeric(10, 2) not null default 300,
  currency text not null default 'AED',
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (1);

-- ─────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('DV' || nextval('public.order_number_seq')),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  full_name text not null,
  phone text,
  shipping_address jsonb not null default '{}',
  subtotal numeric(10, 2) not null,
  discount_amount numeric(10, 2) not null default 0,
  shipping_amount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  coupon_code text,
  currency text not null default 'AED',
  payment_method text not null default 'cod',
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_provider text,
  payment_reference text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  tracking_number text,
  carrier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_created_idx on public.orders (created_at desc);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_label text,
  image_url text,
  unit_price numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10, 2) not null
);

create index order_items_order_idx on public.order_items (order_id);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, created_at);

-- Log every status change, and put stock back when an order is cancelled or returned.
create or replace function public.on_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_events (order_id, status, created_by)
    values (new.id, new.status, auth.uid());

    if new.status in ('cancelled', 'returned') and old.status not in ('cancelled', 'returned') then
      update public.product_variants v
         set stock = v.stock + oi.quantity
        from public.order_items oi
       where oi.order_id = new.id and oi.variant_id = v.id;
    elsif old.status in ('cancelled', 'returned') and new.status not in ('cancelled', 'returned') then
      update public.product_variants v
         set stock = greatest(0, v.stock - oi.quantity)
        from public.order_items oi
       where oi.order_id = new.id and oi.variant_id = v.id;
    end if;
  end if;
  return new;
end;
$$;

create trigger orders_status_change
  after update of status on public.orders
  for each row execute function public.on_order_status_change();

-- ─────────────────────────────────────────────────────────────
-- Coupon validation (callable by anyone; reveals only the computed discount)
-- ─────────────────────────────────────────────────────────────
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.coupons;
  v_discount numeric(10, 2);
begin
  select * into c from public.coupons where code = upper(trim(p_code));
  if not found or not c.is_active then
    return jsonb_build_object('valid', false, 'message', 'This code is not valid.');
  end if;
  if c.starts_at is not null and now() < c.starts_at then
    return jsonb_build_object('valid', false, 'message', 'This code is not active yet.');
  end if;
  if c.expires_at is not null and now() > c.expires_at then
    return jsonb_build_object('valid', false, 'message', 'This code has expired.');
  end if;
  if c.usage_limit is not null and c.used_count >= c.usage_limit then
    return jsonb_build_object('valid', false, 'message', 'This code has reached its usage limit.');
  end if;
  if p_subtotal < c.min_order_amount then
    return jsonb_build_object('valid', false, 'message', format('Spend AED %s or more to use this code.', c.min_order_amount));
  end if;

  if c.discount_type = 'percent' then
    v_discount := round(p_subtotal * c.value / 100, 2);
  else
    v_discount := c.value;
  end if;
  if c.max_discount is not null then
    v_discount := least(v_discount, c.max_discount);
  end if;
  v_discount := least(v_discount, p_subtotal);

  return jsonb_build_object(
    'valid', true,
    'code', c.code,
    'discount', v_discount,
    'description', c.description,
    'message', 'Code applied.'
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Place order: prices, stock and coupon are all checked server-side in one transaction.
-- p_items:    [{ "variant_id": uuid, "quantity": int }]
-- p_customer: { email, full_name, phone, address: { line1, line2, city, emirate, country, notes } }
-- ─────────────────────────────────────────────────────────────
create or replace function public.place_order(p_items jsonb, p_customer jsonb, p_coupon text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.store_settings;
  item jsonb;
  v record;
  v_qty int;
  v_subtotal numeric(10, 2) := 0;
  v_discount numeric(10, 2) := 0;
  v_shipping numeric(10, 2);
  v_coupon jsonb;
  v_coupon_code text;
  v_order public.orders;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Your bag is empty.';
  end if;
  if coalesce(trim(p_customer ->> 'email'), '') = '' or coalesce(trim(p_customer ->> 'full_name'), '') = '' then
    raise exception 'Name and email are required.';
  end if;

  select * into s from public.store_settings where id = 1;

  -- First pass: lock variants, check stock, total up.
  for item in select * from jsonb_array_elements(p_items) loop
    v_qty := (item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'Invalid quantity.';
    end if;

    select pv.id, pv.stock, pv.size, pv.color, p.id as product_id, p.name, p.price, p.images, p.is_active
      into v
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
     where pv.id = (item ->> 'variant_id')::uuid
       for update of pv;

    if not found or not v.is_active then
      raise exception 'A product in your bag is no longer available.';
    end if;
    if v.stock < v_qty then
      raise exception 'Only % left of % (%).', v.stock, v.name, v.size;
    end if;

    v_subtotal := v_subtotal + v.price * v_qty;
  end loop;

  if p_coupon is not null and trim(p_coupon) <> '' then
    v_coupon := public.validate_coupon(p_coupon, v_subtotal);
    if not (v_coupon ->> 'valid')::boolean then
      raise exception '%', v_coupon ->> 'message';
    end if;
    v_discount := (v_coupon ->> 'discount')::numeric;
    v_coupon_code := v_coupon ->> 'code';
    update public.coupons set used_count = used_count + 1 where code = v_coupon_code;
  end if;

  v_shipping := case when v_subtotal - v_discount >= s.free_shipping_threshold then 0 else s.shipping_flat end;

  insert into public.orders (
    user_id, email, full_name, phone, shipping_address,
    subtotal, discount_amount, shipping_amount, total, coupon_code, currency, payment_method
  ) values (
    auth.uid(),
    lower(trim(p_customer ->> 'email')),
    trim(p_customer ->> 'full_name'),
    nullif(trim(p_customer ->> 'phone'), ''),
    coalesce(p_customer -> 'address', '{}'::jsonb),
    v_subtotal, v_discount, v_shipping, v_subtotal - v_discount + v_shipping,
    v_coupon_code, s.currency, coalesce(nullif(p_customer ->> 'payment_method', ''), 'cod')
  ) returning * into v_order;

  -- Second pass: write lines and take stock.
  for item in select * from jsonb_array_elements(p_items) loop
    v_qty := (item ->> 'quantity')::int;
    select pv.id, pv.size, pv.color, p.id as product_id, p.name, p.price, p.images
      into v
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
     where pv.id = (item ->> 'variant_id')::uuid;

    insert into public.order_items (order_id, product_id, variant_id, product_name, variant_label, image_url, unit_price, quantity, line_total)
    values (
      v_order.id, v.product_id, v.id, v.name,
      concat_ws(' / ', nullif(v.size, 'One Size'), v.color),
      v.images[1], v.price, v_qty, v.price * v_qty
    );

    update public.product_variants set stock = stock - v_qty where id = v.id;
  end loop;

  insert into public.order_events (order_id, status, note) values (v_order.id, 'pending', 'Order placed');

  return jsonb_build_object('id', v_order.id, 'order_number', v_order.order_number, 'total', v_order.total);
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Order tracking for guests (order number + email must match)
-- ─────────────────────────────────────────────────────────────
create or replace function public.track_order(p_order_number text, p_email text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'order', to_jsonb(o) - 'user_id' - 'payment_reference',
    'items', coalesce((select jsonb_agg(to_jsonb(oi) order by oi.product_name) from public.order_items oi where oi.order_id = o.id), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(e) - 'created_by' order by e.created_at) from public.order_events e where e.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where upper(o.order_number) = upper(trim(p_order_number))
    and lower(o.email) = lower(trim(p_email));
$$;

-- ─────────────────────────────────────────────────────────────
-- Row level security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;

create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles for update using (id = auth.uid() or public.is_admin());

create policy "categories read" on public.categories for select using (is_active or public.is_admin());
create policy "categories admin" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "products read" on public.products for select using (is_active or public.is_admin());
create policy "products admin" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "variants read" on public.product_variants for select using (true);
create policy "variants admin" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

create policy "reviews read" on public.reviews for select using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy "reviews submit" on public.reviews for insert
  with check (status = 'pending' and admin_reply is null and (user_id is null or user_id = auth.uid()));
create policy "reviews admin update" on public.reviews for update using (public.is_admin()) with check (public.is_admin());
create policy "reviews admin delete" on public.reviews for delete using (public.is_admin());

create policy "coupons admin" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

create policy "settings read" on public.store_settings for select using (true);
create policy "settings admin" on public.store_settings for update using (public.is_admin()) with check (public.is_admin());

create policy "orders read" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "orders admin update" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "orders admin delete" on public.orders for delete using (public.is_admin());

create policy "order items read" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "order items admin" on public.order_items for all using (public.is_admin()) with check (public.is_admin());

create policy "order events read" on public.order_events for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
create policy "order events admin" on public.order_events for all using (public.is_admin()) with check (public.is_admin());

grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb, text) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Storage: product images (public read, admin write)
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product images public read" on storage.objects for select using (bucket_id = 'product-images');
create policy "product images admin insert" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "product images admin update" on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());
create policy "product images admin delete" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());
