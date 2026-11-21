-- Tabla para guardar el jardín de cada usuario.
-- Pegá esto en Supabase → SQL Editor → New query → Run (una sola vez).

create table if not exists public.jardines (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  datos jsonb not null,
  actualizado_en timestamptz not null default now()
);

-- Los usuarios con sesión iniciada pueden usar la tabla (los proyectos nuevos de Supabase no lo dan solo).
-- Los invitados (rol anon) no tienen acceso.
grant select, insert, update on public.jardines to authenticated;

-- Seguridad: cada usuario solo puede ver y modificar su propio jardín.
alter table public.jardines enable row level security;

create policy "Ver mi jardín"
  on public.jardines for select
  using ((select auth.uid()) = usuario_id);

create policy "Crear mi jardín"
  on public.jardines for insert
  with check ((select auth.uid()) = usuario_id);

create policy "Actualizar mi jardín"
  on public.jardines for update
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
