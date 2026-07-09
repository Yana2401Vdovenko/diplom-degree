-- General role permissions and CRUD control layer for the admin panel.
-- Run this file in Supabase SQL Editor, then connect the UI to role_permissions.

create table if not exists public.role_permissions (
  role_name text not null,
  table_name text not null,
  can_read boolean not null default false,
  can_create boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (role_name, table_name)
);

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    ''
  );
$$;

create or replace function public.has_permission(target_table text, target_action text)
returns boolean
language sql
stable
as $$
  select
    public.current_app_role() = 'admin'
    or exists (
      select 1
      from public.role_permissions rp
      where rp.role_name = public.current_app_role()
        and rp.table_name = target_table
        and case target_action
          when 'read' then rp.can_read
          when 'create' then rp.can_create
          when 'update' then rp.can_update
          when 'delete' then rp.can_delete
          else false
        end
    );
$$;

create or replace function public.touch_role_permissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_role_permissions_updated_at on public.role_permissions;
create trigger trg_role_permissions_updated_at
before update on public.role_permissions
for each row execute function public.touch_role_permissions_updated_at();

alter table public.role_permissions enable row level security;

drop policy if exists "role_permissions admin read" on public.role_permissions;
create policy "role_permissions admin read"
on public.role_permissions
for select
to authenticated
using (public.current_app_role() = 'admin');

drop policy if exists "role_permissions admin insert" on public.role_permissions;
create policy "role_permissions admin insert"
on public.role_permissions
for insert
to authenticated
with check (public.current_app_role() = 'admin');

drop policy if exists "role_permissions admin update" on public.role_permissions;
create policy "role_permissions admin update"
on public.role_permissions
for update
to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

drop policy if exists "role_permissions admin delete" on public.role_permissions;
create policy "role_permissions admin delete"
on public.role_permissions
for delete
to authenticated
using (public.current_app_role() = 'admin');

-- Seed the known project tables. Admin is always allowed by has_permission(),
-- but these rows make the configuration visible in the database.
insert into public.role_permissions (
  role_name,
  table_name,
  can_read,
  can_create,
  can_update,
  can_delete
)
select
  'admin',
  table_name,
  true,
  true,
  true,
  true
from (
  values
    ('Архів'),
    ('Навантаження'),
    ('Кафедральна_інформація'),
    ('Завантаження_навантаження'),
    ('Дисципліни'),
    ('Посада'),
    ('Статус_викладача'),
    ('Тип_викладача'),
    ('Форма_навчання'),
    ('Рівень_навчання'),
    ('Завантажені_документи'),
    ('Кафедра'),
    ('Викладач'),
    ('Факультет_ННІ'),
    ('Абревіатура'),
    ('ОПП'),
    ('Спеціальність')
) as tables(table_name)
on conflict (role_name, table_name) do update
set
  can_read = excluded.can_read,
  can_create = excluded.can_create,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete;

-- Template for direct RLS policies on a table.
-- Replace "Посада" with another table name and repeat for every table.
alter table public."Посада" enable row level security;

drop policy if exists "Посада read by permission" on public."Посада";
create policy "Посада read by permission"
on public."Посада"
for select
to authenticated
using (public.has_permission('Посада', 'read'));

drop policy if exists "Посада create by permission" on public."Посада";
create policy "Посада create by permission"
on public."Посада"
for insert
to authenticated
with check (public.has_permission('Посада', 'create'));

drop policy if exists "Посада update by permission" on public."Посада";
create policy "Посада update by permission"
on public."Посада"
for update
to authenticated
using (public.has_permission('Посада', 'update'))
with check (public.has_permission('Посада', 'update'));

drop policy if exists "Посада delete by permission" on public."Посада";
create policy "Посада delete by permission"
on public."Посада"
for delete
to authenticated
using (public.has_permission('Посада', 'delete'));

-- Optional view + trigger layer example for controlled CRUD through a view.
create or replace view public.v_posada as
select *
from public."Посада"
where public.has_permission('Посада', 'read');

create or replace function public.v_posada_insert()
returns trigger
language plpgsql
security definer
as $$
begin
  if not public.has_permission('Посада', 'create') then
    raise exception 'Недостатньо прав для додавання в Посада';
  end if;

  insert into public."Посада" ("Код_посади", "Назва")
  values (new."Код_посади", new."Назва");

  return new;
end;
$$;

drop trigger if exists trg_v_posada_insert on public.v_posada;
create trigger trg_v_posada_insert
instead of insert on public.v_posada
for each row execute function public.v_posada_insert();

create or replace function public.v_posada_update()
returns trigger
language plpgsql
security definer
as $$
begin
  if not public.has_permission('Посада', 'update') then
    raise exception 'Недостатньо прав для редагування Посада';
  end if;

  update public."Посада"
  set "Назва" = new."Назва"
  where "Код_посади" = old."Код_посади";

  return new;
end;
$$;

drop trigger if exists trg_v_posada_update on public.v_posada;
create trigger trg_v_posada_update
instead of update on public.v_posada
for each row execute function public.v_posada_update();

create or replace function public.v_posada_delete()
returns trigger
language plpgsql
security definer
as $$
begin
  if not public.has_permission('Посада', 'delete') then
    raise exception 'Недостатньо прав для видалення Посада';
  end if;

  delete from public."Посада"
  where "Код_посади" = old."Код_посади";

  return old;
end;
$$;

drop trigger if exists trg_v_posada_delete on public.v_posada;
create trigger trg_v_posada_delete
instead of delete on public.v_posada
for each row execute function public.v_posada_delete();
