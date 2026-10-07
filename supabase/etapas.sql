-- =====================================================================
-- CCN - Módulo de Etapas (fases del discípulo)
-- Pega TODO este archivo en Supabase > SQL Editor > New query > Run
-- (Ejecútalo DESPUÉS de schema.sql). Se puede ejecutar más de una vez.
--
-- Fases:  1 = Ruta al Éxito
--         2 = ESFORDI (Escuela de Formación Discipular)
--         3 = ADN CCN
--         4 = ESFORMI (Escuela de Formación Ministerial)
-- =====================================================================

-- ---------- Tabla: una fila por persona y fase ----------
create table if not exists public.etapas_progreso (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  fase smallint not null check (fase between 1 and 4),
  fecha_inicio date not null,
  fecha_fin date,
  creado_en timestamptz not null default now(),
  constraint etapas_fechas_validas check (fecha_fin is null or fecha_fin >= fecha_inicio),
  constraint etapas_una_por_fase unique (perfil_id, fase)
);

create index if not exists etapas_perfil_idx on public.etapas_progreso (perfil_id);

alter table public.etapas_progreso enable row level security;

-- ---------- ¿Puede el usuario actual registrar etapas de esta persona? ----------
-- Solo para discípulos. Puede: el propio discípulo, sus superiores (líder, pastor base)
-- y cualquier Pastor aprobado. Siempre que el usuario actual esté aprobado.
create or replace function public.puede_editar_etapa(objetivo uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    exists (select 1 from public.perfiles where id = objetivo and nivel = 'discipulo')
    and exists (select 1 from public.perfiles where id = auth.uid() and estado = 'aprobado')
    and (
      objetivo = auth.uid()
      or public.es_pastor_aprobado()
      or public.es_descendiente(auth.uid(), objetivo)
    );
$$;

-- ---------- Políticas de seguridad (RLS) ----------
drop policy if exists "ver_etapas" on public.etapas_progreso;
create policy "ver_etapas" on public.etapas_progreso
  for select to authenticated
  using (public.puede_ver(perfil_id));

drop policy if exists "crear_etapas" on public.etapas_progreso;
create policy "crear_etapas" on public.etapas_progreso
  for insert to authenticated
  with check (public.puede_editar_etapa(perfil_id));

drop policy if exists "editar_etapas" on public.etapas_progreso;
create policy "editar_etapas" on public.etapas_progreso
  for update to authenticated
  using (public.puede_editar_etapa(perfil_id))
  with check (public.puede_editar_etapa(perfil_id));

drop policy if exists "borrar_etapas" on public.etapas_progreso;
create policy "borrar_etapas" on public.etapas_progreso
  for delete to authenticated
  using (public.puede_editar_etapa(perfil_id));

-- ---------- Permisos de acceso (Supabase no los da automáticamente) ----------
grant select, insert, update, delete on public.etapas_progreso to authenticated;
grant execute on function public.puede_editar_etapa(uuid) to authenticated;
