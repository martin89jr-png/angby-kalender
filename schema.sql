-- Kör i Supabase Dashboard > SQL Editor.
create table if not exists public.calendar_tasks (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 date date not null,
 title text not null check (char_length(title) between 1 and 180),
 time time,
 priority text not null default 'Normal' check (priority in ('Låg','Normal','Hög')),
 reminder text not null default 'Ingen',
 done boolean not null default false,
 checklist jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.calendar_tasks enable row level security;
create policy "Read own tasks" on public.calendar_tasks for select to authenticated using (auth.uid()=user_id);
create policy "Insert own tasks" on public.calendar_tasks for insert to authenticated with check (auth.uid()=user_id);
create policy "Update own tasks" on public.calendar_tasks for update to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Delete own tasks" on public.calendar_tasks for delete to authenticated using (auth.uid()=user_id);
create index if not exists calendar_tasks_user_date_idx on public.calendar_tasks(user_id,date);
