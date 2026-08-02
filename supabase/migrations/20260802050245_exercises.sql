-- Слайс 2 — Справочник упражнений.
-- Первые пользовательские таблицы: exercises + связка с группами мышц + глобальный
-- справочник muscle_groups. RLS на каждой (правило 2), инварианты в базе (правило 5).
-- См. docs/DATA-MODEL.md.

-- ── muscle_groups: глобальный read-only справочник (исключение из правила 2) ──────────
create table muscle_groups (
  id smallint primary key,
  name text not null
);

insert into muscle_groups (id, name) values
  (1, 'Грудь'),
  (2, 'Спина'),
  (3, 'Ноги'),
  (4, 'Плечи'),
  (5, 'Бицепс'),
  (6, 'Трицепс'),
  (7, 'Кор');

alter table muscle_groups enable row level security;

-- Только чтение и только для залогиненных. INSERT/UPDATE/DELETE-политик нет → read-only.
create policy "muscle_groups: read for authenticated"
  on muscle_groups for select
  to authenticated
  using (true);

-- ── exercises: справочник упражнений пользователя ────────────────────────────────────
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  is_bodyweight boolean not null default false,
  video_url text,
  note text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index exercises_user_id_idx on exercises (user_id);

alter table exercises enable row level security;

create policy "exercises: select own"
  on exercises for select
  to authenticated
  using (user_id = auth.uid());

create policy "exercises: insert own"
  on exercises for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "exercises: update own"
  on exercises for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "exercises: delete own"
  on exercises for delete
  to authenticated
  using (user_id = auth.uid());

-- ── exercise_muscle_groups: связка упражнение ↔ группы ───────────────────────────────
create table exercise_muscle_groups (
  exercise_id uuid not null references exercises (id) on delete cascade,
  muscle_group_id smallint not null references muscle_groups (id),
  is_primary boolean not null default false,
  primary key (exercise_id, muscle_group_id)
);

-- Не более одной основной группы на упражнение (DATA-MODEL). «Ровно одна» гарантирует
-- логика фронта: primary обязателен в форме.
create unique index exercise_muscle_groups_one_primary_idx
  on exercise_muscle_groups (exercise_id)
  where is_primary;

alter table exercise_muscle_groups enable row level security;

-- Владение — через родительское упражнение.
create policy "emg: select via own exercise"
  on exercise_muscle_groups for select
  to authenticated
  using (
    exists (
      select 1 from exercises e
      where e.id = exercise_id and e.user_id = auth.uid()
    )
  );

create policy "emg: insert via own exercise"
  on exercise_muscle_groups for insert
  to authenticated
  with check (
    exists (
      select 1 from exercises e
      where e.id = exercise_id and e.user_id = auth.uid()
    )
  );

create policy "emg: delete via own exercise"
  on exercise_muscle_groups for delete
  to authenticated
  using (
    exists (
      select 1 from exercises e
      where e.id = exercise_id and e.user_id = auth.uid()
    )
  );
