-- =====================================================================
-- Centro Cristiano para las Naciones (CCN) - Base de datos
-- Pega TODO este archivo en Supabase > SQL Editor > New query > Run
-- Se puede ejecutar más de una vez sin problema.
-- =====================================================================

-- ---------- Tabla de perfiles ----------
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  correo text not null,
  nombre_usuario text not null,
  nombres text not null,
  apellidos text not null,
  fecha_nacimiento date not null,
  sexo text not null check (sexo in ('masculino', 'femenino')),
  direccion text not null,
  telefono text not null,
  contacto_emergencia_nombre text,
  telefono_emergencia text not null,
  nivel text not null check (nivel in ('pastor', 'pastor_base', 'lider', 'discipulo')),
  superior_id uuid references public.perfiles(id) on delete set null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  creado_en timestamptz not null default now()
);

create unique index if not exists perfiles_usuario_unico on public.perfiles (lower(nombre_usuario));
create unique index if not exists perfiles_correo_unico on public.perfiles (lower(correo));
create index if not exists perfiles_superior_idx on public.perfiles (superior_id);

alter table public.perfiles enable row level security;

-- ---------- Funciones auxiliares (seguras) ----------

-- ¿El usuario actual es un Pastor aprobado?
create or replace function public.es_pastor_aprobado()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and nivel = 'pastor' and estado = 'aprobado'
  );
$$;

-- ¿"ancestro" está por encima de "objetivo" en la cadena?
create or replace function public.es_descendiente(ancestro uuid, objetivo uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  with recursive cadena as (
    select superior_id from public.perfiles where id = objetivo
    union all
    select p.superior_id from public.perfiles p join cadena c on p.id = c.superior_id
  )
  select exists (select 1 from cadena where superior_id = ancestro);
$$;

-- ¿El usuario actual puede ver este perfil?
create or replace function public.puede_ver(objetivo uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    objetivo = auth.uid()
    or public.es_pastor_aprobado()
    or (
      exists (select 1 from public.perfiles where id = auth.uid() and estado = 'aprobado')
      and public.es_descendiente(auth.uid(), objetivo)
    );
$$;

-- ---------- Políticas de seguridad (RLS) ----------
drop policy if exists "ver_perfiles" on public.perfiles;
create policy "ver_perfiles" on public.perfiles
  for select to authenticated
  using (public.puede_ver(id));

drop policy if exists "editar_perfiles" on public.perfiles;
create policy "editar_perfiles" on public.perfiles
  for update to authenticated
  using (id = auth.uid() or public.es_pastor_aprobado())
  with check (id = auth.uid() or public.es_pastor_aprobado());

-- No hay políticas de insert/delete: los perfiles se crean solo con el trigger de registro.

-- ---------- Protección de columnas sensibles ----------
create or replace function public.proteger_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Desde el SQL Editor (sin usuario) se permite todo.
  if auth.uid() is null then
    return new;
  end if;

  new.id := old.id;
  new.correo := old.correo;
  new.creado_en := old.creado_en;

  if old.id = auth.uid() then
    -- Editando su propio perfil: no puede cambiar nivel, estado ni superior.
    new.nivel := old.nivel;
    new.estado := old.estado;
    new.superior_id := old.superior_id;
  else
    -- Un Pastor editando a otra persona: solo puede cambiar el estado.
    new.nombre_usuario := old.nombre_usuario;
    new.nombres := old.nombres;
    new.apellidos := old.apellidos;
    new.fecha_nacimiento := old.fecha_nacimiento;
    new.sexo := old.sexo;
    new.direccion := old.direccion;
    new.telefono := old.telefono;
    new.contacto_emergencia_nombre := old.contacto_emergencia_nombre;
    new.telefono_emergencia := old.telefono_emergencia;
    new.nivel := old.nivel;
    new.superior_id := old.superior_id;
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_perfil_trg on public.perfiles;
create trigger proteger_perfil_trg
  before update on public.perfiles
  for each row execute function public.proteger_perfil();

-- ---------- Creación automática del perfil al registrarse ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nivel text := coalesce(m->>'nivel', 'discipulo');
  v_superior uuid := nullif(m->>'superior_id', '')::uuid;
  v_estado text := 'pendiente';
  v_nivel_superior text;
begin
  if v_nivel not in ('pastor', 'pastor_base', 'lider', 'discipulo') then
    raise exception 'Nivel no válido';
  end if;

  if v_nivel = 'pastor' then
    v_superior := null;
    -- El primer Pastor de la iglesia queda aprobado automáticamente.
    if not exists (select 1 from public.perfiles where nivel = 'pastor' and estado = 'aprobado') then
      v_estado := 'aprobado';
    end if;
  else
    v_nivel_superior := case v_nivel
      when 'pastor_base' then 'pastor'
      when 'lider' then 'pastor_base'
      else 'lider'
    end;
    if v_superior is null or not exists (
      select 1 from public.perfiles
      where id = v_superior and nivel = v_nivel_superior and estado = 'aprobado'
    ) then
      raise exception 'Debes elegir un superior válido';
    end if;
  end if;

  insert into public.perfiles (
    id, correo, nombre_usuario, nombres, apellidos, fecha_nacimiento, sexo,
    direccion, telefono, contacto_emergencia_nombre, telefono_emergencia,
    nivel, superior_id, estado
  ) values (
    new.id,
    new.email,
    m->>'nombre_usuario',
    m->>'nombres',
    m->>'apellidos',
    (m->>'fecha_nacimiento')::date,
    m->>'sexo',
    m->>'direccion',
    m->>'telefono',
    nullif(m->>'contacto_emergencia_nombre', ''),
    m->>'telefono_emergencia',
    v_nivel,
    v_superior,
    v_estado
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Funciones públicas para el registro y el login ----------

-- Lista de personas aprobadas de un nivel (para elegir superior al registrarse).
-- Solo devuelve nombres, nunca teléfonos ni direcciones.
create or replace function public.listar_superiores(p_nivel text)
returns table (id uuid, nombre text, pastor_base text, pastor text)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    p.nombres || ' ' || p.apellidos,
    case when p.nivel = 'lider' then b.nombres || ' ' || b.apellidos end,
    case
      when p.nivel = 'lider' then pa.nombres || ' ' || pa.apellidos
      when p.nivel = 'pastor_base' then b.nombres || ' ' || b.apellidos
    end
  from public.perfiles p
  left join public.perfiles b on b.id = p.superior_id
  left join public.perfiles pa on pa.id = b.superior_id
  where p.nivel = p_nivel and p.estado = 'aprobado'
  order by 2;
$$;

-- ¿Está libre este nombre de usuario?
create or replace function public.usuario_disponible(p_usuario text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (select 1 from public.perfiles where lower(nombre_usuario) = lower(p_usuario));
$$;

-- Correo asociado a un nombre de usuario (para iniciar sesión con usuario).
create or replace function public.correo_por_usuario(p_usuario text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select correo from public.perfiles where lower(nombre_usuario) = lower(p_usuario) limit 1;
$$;

-- Cadena de superiores del usuario actual (solo nombres).
create or replace function public.mi_cadena()
returns table (id uuid, nombres text, apellidos text, nivel text)
language sql
security definer
stable
set search_path = public
as $$
  with recursive cadena as (
    select p.id, p.nombres, p.apellidos, p.nivel, p.superior_id, 1 as paso
    from public.perfiles p
    where p.id = (select superior_id from public.perfiles where id = auth.uid())
    union all
    select p.id, p.nombres, p.apellidos, p.nivel, p.superior_id, c.paso + 1
    from public.perfiles p join cadena c on p.id = c.superior_id
  )
  select id, nombres, apellidos, nivel from cadena order by paso;
$$;

grant execute on function public.listar_superiores(text) to anon, authenticated;
grant execute on function public.usuario_disponible(text) to anon, authenticated;
grant execute on function public.correo_por_usuario(text) to anon, authenticated;
grant execute on function public.mi_cadena() to authenticated;
