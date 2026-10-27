-- Store on/off switch (admin sidebar). When closed, the storefront shows a "back soon" page
-- and place_order refuses new orders.
alter table public.store_settings add column if not exists store_open boolean not null default true;

create or replace function public.ensure_store_open()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (select store_open from public.store_settings where id = 1) then
    raise exception 'The store is closed right now. Please check back soon.';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_require_store_open on public.orders;
create trigger orders_require_store_open
  before insert on public.orders
  for each row execute function public.ensure_store_open();
