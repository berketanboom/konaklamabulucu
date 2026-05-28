-- İlanları tutacağımız ana tablo
create table public.listings (
    id uuid default gen_random_uuid() primary key,
    source text not null, 
    title text not null,  
    price numeric not null,
    available boolean default false,
    url text not null,
    first_seen timestamp with time zone default timezone('utc'::text, now()) not null,
    last_checked timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sorguları hızlandırmak için index
create index idx_listings_source_available on public.listings(source, available);
