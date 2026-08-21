-- ==============================================================================
-- EL ORIGEN — BOUTIQUE WINE TASTINGS
-- Supabase / PostgreSQL Database Schema
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. TASTINGS TABLE
create table if not exists public.tastings (
    id uuid primary key default uuid_generate_v4(),
    slug text unique not null,
    title text not null,
    subtitle text,
    description text not null,
    date date not null,
    date_display text not null,
    date_full text not null,
    time_start text not null,
    time_end text not null,
    location text not null default 'Bodega El Origen, Mendoza, Argentina',
    price numeric not null,
    price_formatted text not null,
    total_spots integer not null default 20,
    available_spots integer not null default 20,
    image_url text not null,
    image_alt text,
    category text not null default 'reserva',
    wines jsonb not null default '[]'::jsonb,
    pairings jsonb not null default '[]'::jsonb,
    sommelier jsonb not null default '{}'::jsonb,
    status text not null default 'active',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ADD-ONS TABLE (Up-selling items)
create table if not exists public.add_ons (
    id text primary key,
    title text not null,
    description text not null,
    price numeric not null,
    price_formatted text not null,
    icon text not null default 'wine_bar',
    category text not null default 'bottle',
    active boolean not null default true
);

-- 3. COUPONS TABLE
create table if not exists public.coupons (
    code text primary key,
    discount_percent numeric default 0,
    discount_amount numeric default 0,
    description text not null,
    active boolean not null default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. RESERVATIONS TABLE
create table if not exists public.reservations (
    id uuid primary key default uuid_generate_v4(),
    token text unique not null default md5(random()::text || clock_timestamp()::text),
    code text unique not null,
    tasting_id uuid references public.tastings(id) on delete cascade not null,
    tasting_title text not null,
    tasting_date text not null,
    tasting_time text not null,
    customer_name text not null,
    customer_email text not null,
    customer_phone text not null,
    spots_count integer not null default 1,
    dietary_restrictions text,
    selected_add_ons jsonb not null default '[]'::jsonb,
    subtotal numeric not null,
    discount_amount numeric not null default 0,
    coupon_code text,
    total_amount numeric not null,
    payment_method text not null default 'stripe',
    payment_status text not null default 'paid',
    transfer_receipt_url text,
    checkin_status text not null default 'pending',
    checked_in_at timestamp with time zone,
    checked_in_by text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SENSORY TASTING NOTES (Interactive Tasting Sheet)
create table if not exists public.tasting_sensory_notes (
    id uuid primary key default uuid_generate_v4(),
    reservation_token text not null,
    tasting_id uuid references public.tastings(id) on delete cascade not null,
    attendee_name text not null,
    wine_index integer not null default 0,
    wine_name text not null,
    visual jsonb not null default '{}'::jsonb,
    aromas jsonb not null default '[]'::jsonb,
    gustative jsonb not null default '{}'::jsonb,
    score numeric not null default 90,
    notes text,
    pairing_idea text,
    saved_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PRIVATE EVENT INQUIRIES (B2B)
create table if not exists public.private_event_inquiries (
    id uuid primary key default uuid_generate_v4(),
    company_or_name text not null,
    contact_email text not null,
    contact_phone text not null,
    estimated_guests integer not null,
    preferred_date date not null,
    event_type text not null default 'corporate',
    pairing_preference text not null default 'premium',
    transport_required boolean not null default false,
    budget_notes text,
    status text not null default 'new',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. EVENT MEMORY PHOTOS
create table if not exists public.event_memory_photos (
    id uuid primary key default uuid_generate_v4(),
    tasting_id uuid references public.tastings(id) on delete cascade not null,
    tasting_date text not null,
    title text not null,
    url text not null,
    photographer text not null default 'Sommelier El Origen',
    uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. NOTIFICATION LOGS
create table if not exists public.notification_logs (
    id uuid primary key default uuid_generate_v4(),
    type text not null,
    recipient text not null,
    reservation_code text not null,
    status text not null default 'sent',
    preview_text text not null,
    sent_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger to deduct available spots automatically on new reservation
create or replace function public.update_available_spots()
returns trigger as $$
begin
    if (TG_OP = 'INSERT' and NEW.payment_status in ('paid', 'pending_transfer')) then
        update public.tastings
        set available_spots = greatest(0, available_spots - NEW.spots_count)
        where id = NEW.tasting_id;
    end if;
    return NEW;
end;
$$ language plpgsql;

create or replace trigger on_reservation_created
after insert on public.reservations
for each row execute function public.update_available_spots();

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

insert into public.coupons (code, discount_percent, description) values
('ORIGEN10', 10, '10% de descuento de bienvenida enoturística'),
('SOMMELIER20', 20, '20% de descuento para amantes del vino'),
('VIP2024', 15, '15% de cortesía para invitados especiales');

insert into public.add_ons (id, title, description, price, price_formatted, icon, category) values
('gran-reserva-bottle', 'Botella Malbec Gran Reserva 2020', 'Botella numerada de colección firmada por el enólogo jefe para llevar a casa.', 28000, '$28.000', 'wine_bar', 'bottle'),
('private-transfer', 'Traslado Privado Ida y Vuelta', 'Chofer privado desde tu hotel o centro de la ciudad hasta la bodega en van ejecutiva.', 18000, '$18.000', 'directions_car', 'transport'),
('pairing-premium', 'Maridaje de Quesos Madurados & Embutidos', 'Tabla de autor con quesos de cabra curados, jamón serrano y panes de masa madre.', 12000, '$12.000', 'restaurant', 'pairing');
