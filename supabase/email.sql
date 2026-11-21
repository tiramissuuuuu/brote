-- Para avisar "ese email ya está registrado" mientras el usuario escribe (en la pantalla de crear cuenta).
-- Correr en Supabase → SQL Editor → New query → Run. Se puede volver a correr.
--
-- Ojo: esto permite que cualquiera averigüe si un email tiene cuenta (se llama "enumeración de usuarios").
-- Por eso solo devuelve sí o no, nunca otros datos.

create or replace function public.email_registrado(email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u where lower(u.email) = lower(trim(email_registrado.email))
  );
$$;

-- Solo se puede llamar a esta función (no leer la tabla de usuarios).
revoke all on function public.email_registrado(text) from public;
grant execute on function public.email_registrado(text) to anon, authenticated;
