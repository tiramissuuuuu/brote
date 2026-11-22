-- Grupos de estudio por materia, con invitación por link y ranking de horas.
-- Correr DESPUÉS de esquema.sql y estadisticas.sql (el ranking usa la tabla `sesiones`).
-- Supabase → SQL Editor → New query → pegar → Run. Se puede volver a correr.

-- ---------- Tablas ----------

create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 60),
  -- Código del link de invitación (difícil de adivinar).
  codigo text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  creado_por uuid not null references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now()
);

-- Cada miembro conecta una de SUS materias al grupo (su "Redes" se suma al grupo "Redes FING").
create table if not exists public.miembros_grupo (
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  materia_id text not null,
  nombre text not null check (char_length(nombre) between 1 and 60),
  unido_en timestamptz not null default now(),
  primary key (grupo_id, usuario_id)
);

create index if not exists miembros_grupo_usuario on public.miembros_grupo (usuario_id);

-- ---------- Seguridad ----------
-- Cada uno ve solo los grupos donde está (y quiénes son los otros miembros).
-- Nadie escribe directo: crear, unirse y salir se hace con las funciones de abajo.

alter table public.grupos enable row level security;
alter table public.miembros_grupo enable row level security;

grant select on public.grupos, public.miembros_grupo to authenticated;

create or replace function public.es_miembro(grupo uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.miembros_grupo m where m.grupo_id = grupo and m.usuario_id = auth.uid()
  );
$$;

drop policy if exists "Ver mis grupos" on public.grupos;
create policy "Ver mis grupos"
  on public.grupos for select
  using (public.es_miembro(id));

drop policy if exists "Ver los miembros de mis grupos" on public.miembros_grupo;
create policy "Ver los miembros de mis grupos"
  on public.miembros_grupo for select
  using (public.es_miembro(grupo_id));

-- ---------- Funciones ----------

-- Crea un grupo y te agrega como primer miembro con tu materia.
create or replace function public.crear_grupo(nombre_grupo text, materia text, nombre_miembro text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo uuid;
begin
  if auth.uid() is null then
    raise exception 'Hace falta iniciar sesión';
  end if;
  insert into public.grupos (nombre, creado_por)
  values (trim(nombre_grupo), auth.uid())
  returning id into nuevo;
  insert into public.miembros_grupo (grupo_id, usuario_id, materia_id, nombre)
  values (nuevo, auth.uid(), materia, trim(nombre_miembro));
  return nuevo;
end;
$$;

-- Lo que se muestra al abrir un link de invitación (antes de unirse): nombre y cantidad de miembros.
create or replace function public.info_invitacion(codigo_invitacion text)
returns table (id uuid, nombre text, miembros integer)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.nombre, (select count(*)::integer from public.miembros_grupo m where m.grupo_id = g.id)
  from public.grupos g
  where g.codigo = codigo_invitacion;
$$;

-- Unirse con el código del link. Si ya estabas, actualiza qué materia conectaste.
create or replace function public.unirse_grupo(codigo_invitacion text, materia text, nombre_miembro text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  grupo uuid;
begin
  if auth.uid() is null then
    raise exception 'Hace falta iniciar sesión';
  end if;
  select g.id into grupo from public.grupos g where g.codigo = codigo_invitacion;
  if grupo is null then
    raise exception 'La invitación no existe';
  end if;
  insert into public.miembros_grupo (grupo_id, usuario_id, materia_id, nombre)
  values (grupo, auth.uid(), materia, trim(nombre_miembro))
  on conflict (grupo_id, usuario_id) do update set materia_id = excluded.materia_id, nombre = excluded.nombre;
  return grupo;
end;
$$;

-- Salir de un grupo. Si no queda nadie, el grupo se borra.
create or replace function public.salir_grupo(grupo uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.miembros_grupo m where m.grupo_id = grupo and m.usuario_id = auth.uid();
  delete from public.grupos g
  where g.id = grupo and not exists (select 1 from public.miembros_grupo m where m.grupo_id = grupo);
end;
$$;

-- Ranking: horas de cada miembro en su materia del grupo, entre `desde` y `hasta` (null = sin límite).
-- Solo lo puede pedir alguien que esté en el grupo. De los demás solo se ve el nombre y las horas.
create or replace function public.ranking_grupo(grupo uuid, desde timestamptz default null, hasta timestamptz default null)
returns table (usuario_id uuid, nombre text, horas numeric, sesiones integer, soy_yo boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.usuario_id,
    m.nombre,
    round((coalesce(sum(greatest(0, extract(epoch from (
      least(s.fin, coalesce(hasta, 'infinity'::timestamptz)) - greatest(s.inicio, coalesce(desde, '-infinity'::timestamptz))
    )))), 0) / 3600)::numeric, 2),
    count(s.id)::integer,
    m.usuario_id = auth.uid()
  from public.miembros_grupo m
  left join public.sesiones s
    on s.usuario_id = m.usuario_id
    and s.materia_id = m.materia_id
    and (hasta is null or s.inicio < hasta)
    and (desde is null or s.fin > desde)
  where m.grupo_id = grupo
    -- Si no estás en el grupo, no devuelve nada.
    and public.es_miembro(grupo)
  group by m.usuario_id, m.nombre
  order by 3 desc, 2;
$$;

-- Quién puede llamar a cada función.
revoke all on function public.es_miembro(uuid) from public;
revoke all on function public.crear_grupo(text, text, text) from public;
revoke all on function public.info_invitacion(text) from public;
revoke all on function public.unirse_grupo(text, text, text) from public;
revoke all on function public.salir_grupo(uuid) from public;
revoke all on function public.ranking_grupo(uuid, timestamptz, timestamptz) from public;

grant execute on function public.es_miembro(uuid) to authenticated;
grant execute on function public.crear_grupo(text, text, text) to authenticated;
-- La invitación se puede ver sin cuenta (para mostrar "Te invitaron a ...").
grant execute on function public.info_invitacion(text) to anon, authenticated;
grant execute on function public.unirse_grupo(text, text, text) to authenticated;
grant execute on function public.salir_grupo(uuid) to authenticated;
grant execute on function public.ranking_grupo(uuid, timestamptz, timestamptz) to authenticated;
