-- Слайс 3 — Конструктор дней.
-- day_templates (типы дней: Push/Pull/Legs) + template_exercises (упражнение в дне с планом).
-- RLS на каждой (правило 2), инварианты в базе (правило 5). См. docs/DATA-MODEL.md.

-- ── day_templates: типы дней пользователя ────────────────────────────────────────────
create table day_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index day_templates_user_id_idx on day_templates (user_id);

alter table day_templates enable row level security;

create policy "day_templates: select own"
  on day_templates for select
  to authenticated
  using (user_id = auth.uid());

create policy "day_templates: insert own"
  on day_templates for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "day_templates: update own"
  on day_templates for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "day_templates: delete own"
  on day_templates for delete
  to authenticated
  using (user_id = auth.uid());

-- ── template_exercises: упражнение в дне (ядро планирования) ──────────────────────────
-- weight — текущий рабочий вес пары «упражнение + день»; null для bodyweight. В этом
-- слайсе двигается только руками (ratchet — Слайс 5). Согласованность «bodyweight ↔
-- weight is null» держит логика фронта (DATA-MODEL, без кросс-табличного триггера в v1).
create table template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references day_templates (id) on delete cascade,
  exercise_id uuid not null references exercises (id),
  position smallint not null,
  sets_planned smallint not null,
  reps_planned smallint not null,
  weight numeric,
  unique (template_id, exercise_id),
  check (weight is null or weight > 0),
  check (sets_planned > 0),
  check (reps_planned > 0)
);

create index template_exercises_template_id_idx on template_exercises (template_id);

alter table template_exercises enable row level security;

-- Владение — через родительский день (паттерн exercise_muscle_groups).
create policy "template_exercises: select via own day"
  on template_exercises for select
  to authenticated
  using (
    exists (
      select 1 from day_templates d
      where d.id = template_id and d.user_id = auth.uid()
    )
  );

create policy "template_exercises: insert via own day"
  on template_exercises for insert
  to authenticated
  with check (
    exists (
      select 1 from day_templates d
      where d.id = template_id and d.user_id = auth.uid()
    )
  );

create policy "template_exercises: update via own day"
  on template_exercises for update
  to authenticated
  using (
    exists (
      select 1 from day_templates d
      where d.id = template_id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from day_templates d
      where d.id = template_id and d.user_id = auth.uid()
    )
  );

create policy "template_exercises: delete via own day"
  on template_exercises for delete
  to authenticated
  using (
    exists (
      select 1 from day_templates d
      where d.id = template_id and d.user_id = auth.uid()
    )
  );
