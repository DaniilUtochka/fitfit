-- Слайс 4 — Тренировка v0.
-- sessions (факт тренировки) + sets (атом истории — подход).
-- RLS на каждой (правило 2), инварианты в базе (правило 5). См. docs/DATA-MODEL.md.

-- ── sessions: тренировка (факт) ──────────────────────────────────────────────────────
-- finished_at is null = активная сессия. Партиал-unique гарантирует не более одной
-- активной сессии на пользователя — восстановление при перезаходе однозначно.
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_id uuid not null references day_templates (id),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index sessions_user_id_idx on sessions (user_id);

create unique index sessions_one_active_idx
  on sessions (user_id)
  where finished_at is null;

alter table sessions enable row level security;

create policy "sessions: select own"
  on sessions for select
  to authenticated
  using (user_id = auth.uid());

create policy "sessions: insert own"
  on sessions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "sessions: update own"
  on sessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "sessions: delete own"
  on sessions for delete
  to authenticated
  using (user_id = auth.uid());

-- ── sets: подход (атом истории) ──────────────────────────────────────────────────────
-- Полностью денормализован: каждый подход самодостаточен (weight/reps скопированы
-- из плана в момент тапа, правило 3). weight null для bodyweight. Владение — через
-- родительскую sessions (паттерн template_exercises → day_templates).
create table sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  exercise_id uuid not null references exercises (id),
  set_number smallint not null,
  weight numeric,
  reps smallint not null,
  created_at timestamptz not null default now(),
  check (weight is null or weight > 0),
  check (reps > 0)
);

create index sets_session_id_idx on sets (session_id);

alter table sets enable row level security;

create policy "sets: select via own session"
  on sets for select
  to authenticated
  using (
    exists (
      select 1 from sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "sets: insert via own session"
  on sets for insert
  to authenticated
  with check (
    exists (
      select 1 from sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "sets: update via own session"
  on sets for update
  to authenticated
  using (
    exists (
      select 1 from sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "sets: delete via own session"
  on sets for delete
  to authenticated
  using (
    exists (
      select 1 from sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
