-- Estadísticas de estudio, para el resumen del año ("wrapped").
-- Correr DESPUÉS de esquema.sql: Supabase → SQL Editor → New query → pegar → Run.
-- Se puede volver a correr sin problema.
--
-- Cómo funciona: la app guarda el jardín entero en `jardines.datos` (JSON). Cada vez que eso cambia,
-- un trigger copia las materias y las sesiones a tablas normales, que se pueden consultar con SQL.
-- La app no tiene que hacer nada más.

-- ---------- Tablas ----------

-- Todas las materias, también las que se sacaron del jardín (archivadas).
create table if not exists public.materias (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  nombre text not null,
  especie text not null,
  meta_semanal integer not null,
  color text,
  creada_en timestamptz not null,
  archivada_en timestamptz,
  primary key (usuario_id, id)
);

-- Cada sesión de estudio terminada (con cronómetro o cargada a mano).
create table if not exists public.sesiones (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  materia_id text not null,
  inicio timestamptz not null,
  fin timestamptz not null,
  manual boolean not null default false,
  primary key (usuario_id, id)
);

create index if not exists sesiones_usuario_inicio on public.sesiones (usuario_id, inicio);

-- ---------- Seguridad: cada usuario solo lee lo suyo y nadie escribe directo ----------

alter table public.materias enable row level security;
alter table public.sesiones enable row level security;

grant select on public.materias, public.sesiones to authenticated;

drop policy if exists "Ver mis materias" on public.materias;
create policy "Ver mis materias"
  on public.materias for select
  using ((select auth.uid()) = usuario_id);

drop policy if exists "Ver mis sesiones" on public.sesiones;
create policy "Ver mis sesiones"
  on public.sesiones for select
  using ((select auth.uid()) = usuario_id);

-- ---------- Copia automática desde el jardín ----------

create or replace function public.copiar_estadisticas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Materias: se agregan las nuevas y se actualizan las existentes (por ejemplo, al archivarlas).
  insert into public.materias (usuario_id, id, nombre, especie, meta_semanal, color, creada_en, archivada_en)
  select
    new.usuario_id,
    m ->> 'id',
    m ->> 'nombre',
    m ->> 'especie',
    (m ->> 'metaSemanal')::integer,
    m ->> 'color',
    to_timestamp((m ->> 'creadaEn')::double precision / 1000),
    to_timestamp((m ->> 'archivadaEn')::double precision / 1000)
  from jsonb_array_elements(coalesce(new.datos -> 'materias', '[]'::jsonb)) as m
  on conflict (usuario_id, id) do update set
    nombre = excluded.nombre,
    especie = excluded.especie,
    meta_semanal = excluded.meta_semanal,
    color = excluded.color,
    archivada_en = excluded.archivada_en;

  -- Sesiones: no cambian una vez terminadas, así que solo se agregan las nuevas.
  insert into public.sesiones (usuario_id, id, materia_id, inicio, fin, manual)
  select
    new.usuario_id,
    s ->> 'id',
    s ->> 'materiaId',
    to_timestamp((s ->> 'inicio')::double precision / 1000),
    to_timestamp((s ->> 'fin')::double precision / 1000),
    coalesce((s ->> 'manual')::boolean, false)
  from jsonb_array_elements(coalesce(new.datos -> 'sesiones', '[]'::jsonb)) as s
  on conflict (usuario_id, id) do nothing;

  -- Lo que se borró en la app (por ejemplo, una sesión cargada por error) deja de contar.
  delete from public.sesiones
  where usuario_id = new.usuario_id
    and id in (select jsonb_array_elements_text(coalesce(new.datos -> 'borrados', '[]'::jsonb)));
  delete from public.materias
  where usuario_id = new.usuario_id
    and id in (select jsonb_array_elements_text(coalesce(new.datos -> 'borrados', '[]'::jsonb)));

  return new;
end;
$$;

drop trigger if exists copiar_estadisticas on public.jardines;
create trigger copiar_estadisticas
  after insert or update of datos on public.jardines
  for each row execute function public.copiar_estadisticas();

-- ---------- Vistas para el resumen del año ----------
-- Las fechas se cuentan en hora de Uruguay.

-- Horas por materia y por año.
create or replace view public.estadisticas_materias_por_anio
with (security_invoker = true) as
select
  s.usuario_id,
  extract(year from (s.inicio at time zone 'America/Montevideo'))::integer as anio,
  s.materia_id,
  m.nombre as materia,
  m.especie,
  round((sum(extract(epoch from (s.fin - s.inicio))) / 3600)::numeric, 2) as horas,
  count(*) as sesiones,
  count(distinct (s.inicio at time zone 'America/Montevideo')::date) as dias,
  min(s.inicio) as primera_sesion,
  max(s.fin) as ultima_sesion
from public.sesiones s
left join public.materias m on m.usuario_id = s.usuario_id and m.id = s.materia_id
group by s.usuario_id, anio, s.materia_id, m.nombre, m.especie;

-- Totales del año por usuario.
create or replace view public.estadisticas_usuario_por_anio
with (security_invoker = true) as
select
  usuario_id,
  extract(year from (inicio at time zone 'America/Montevideo'))::integer as anio,
  round((sum(extract(epoch from (fin - inicio))) / 3600)::numeric, 2) as horas,
  count(*) as sesiones,
  count(distinct materia_id) as materias,
  count(distinct (inicio at time zone 'America/Montevideo')::date) as dias_estudiados,
  round((max(extract(epoch from (fin - inicio))) / 3600)::numeric, 2) as sesion_mas_larga_horas
from public.sesiones
group by usuario_id, anio;

grant select on public.estadisticas_materias_por_anio, public.estadisticas_usuario_por_anio to authenticated;

-- ---------- Cargar lo que ya estaba guardado ----------
-- Vuelve a guardar cada jardín tal como está, para que el trigger copie sus datos.
update public.jardines set datos = datos;
