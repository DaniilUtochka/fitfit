# Модель данных

Статус: accepted (вопросы закрыты 2026-08-02) · База: Postgres (Supabase) · Требования: PRD.md, правила 1-6

## Связи

```
muscle_groups 1──n exercise_muscle_groups n──1 exercises
exercises     1──n template_exercises n──1 day_templates
day_templates 1──n schedule                (день недели → тип дня)
day_templates 1──n sessions
sessions      1──n sets n──1 exercises
```

## Таблицы

### muscle_groups - справочник групп мышц

- id (smallint, pk)
- name (text)

Глобальный справочник с сидом (грудь, спина, ноги, плечи, бицепс, трицепс, кор), без user_id, read-only через RLS.

### exercise_muscle_groups - связка упражнение ↔ группы

- exercise_id → exercises
- muscle_group_id → muscle_groups
- is_primary (bool, default false)
- pk (exercise_id, muscle_group_id)
- partial unique index на exercise_id where is_primary - ровно одна основная группа

Основная группа - для группировки в справочнике и фильтров; вспомогательные - для будущей аналитики объёма по мышцам (v2).

### exercises - справочник упражнений

- id (uuid, pk)
- user_id → auth.users
- name (text)
- is_bodyweight (bool, default false) - подтягивания и тп: вес не трекается, прогрессия по повторам
- video_url (text, null) - как выполнять, на будущее
- note (text, null) - настройка тренажёра и тп
- is_archived (bool, default false)

Веса здесь нет - по правилу 1 он живёт на паре «упражнение + день».

### day_templates - типы дней

- id (uuid, pk)
- user_id → auth.users
- name (text) - Push / Pull / Legs
- is_archived (bool, default false)

### template_exercises - упражнение в дне (ядро планирования)

- id (uuid, pk)
- template_id → day_templates
- exercise_id → exercises
- position (smallint) - порядок в дне
- sets_planned (smallint)
- reps_planned (smallint)
- weight (numeric, null) - **текущий рабочий вес**; null для bodyweight-упражнений
- unique (template_id, exercise_id)
- CHECK (weight is null or weight > 0)

Текущий план Push/Pull/Legs заполнен разовым импортом из Google-таблицы (слайс 7) - детали и хвосты в IMPORT.md.

`weight` - живое поле: при создании = стартовый вес; поднял рабочий вес на тренировке → автоматом write-back вверх (ratchet, правило 4); деволоад - ручная правка сюда же. Историю прошлых весов не хранит - она в sets. Согласованность «bodyweight ↔ weight is null» держит логика приложения (без кросс-табличного триггера в v1).

### schedule - расписание

- id (uuid, pk)
- user_id → auth.users
- weekday (smallint, 1-7)
- template_id → day_templates
- unique (user_id, weekday)

Недельный повторяющийся цикл, фикс. дни (решение по вопросу №2). Календарь будущих тренировок вычисляется из этой таблицы, отдельно даты не храним.

### sessions - тренировка (факт)

- id (uuid, pk)
- user_id → auth.users
- template_id → day_templates
- started_at (timestamptz)
- finished_at (timestamptz, null) - null = активная сессия

### sets - подход (атом истории)

- id (uuid, pk)
- session_id → sessions
- exercise_id → exercises
- set_number (smallint)
- weight (numeric, null) - null для bodyweight
- reps (smallint)
- created_at (timestamptz)
- CHECK (weight is null or weight > 0), CHECK (reps > 0)

Полностью денормализован: каждый подход самодостаточен, история не зависит от последующих правок шаблонов. Тап = insert с плановыми weight/reps (правило 3), точечная коррекция = update одной строки. Внеплановое упражнение = sets с exercise_id вне шаблона, отдельная таблица не нужна.

## Ключевые механики

1. **План тренировки** = template_exercises дня, отсортированные по position. Вес всегда актуален благодаря write-back - «прошлую тренировку» для планирования искать не надо.
2. **«Что было в прошлый раз»** (главный экран) = последние sets по (exercise_id + session.template_id). Пара «упражнение + день» восстанавливается через join, FK на template_exercises в sets не нужен.
3. **Ratchet для веса**: поднял рабочий вес в сессии → сразу UPDATE template_exercises.weight (если выше текущего). Побочный бонус: восстановление после закрытой вкладки читает уже обновлённый план.
4. **Ratchet для bodyweight** - предложение: прогрессия по повторам, перебил reps_planned → план повторов растёт так же, как вес у остальных. Симметрия механики; если не зайдёт - повторы правятся руками в шаблоне, откат дешёвый.
5. **RLS**: на всех таблицах кроме muscle_groups политика user_id = auth.uid(). Инварианты - CHECK-констрейнты, не код фронта.
6. **Архив** (is_archived) вместо DELETE на exercises и day_templates - FK из истории никогда не рвутся. На sets и sessions удаление разрешено (правка своей истории).
7. Вся схема - через файлы миграций в репо, дашборд Supabase read-only (см. ADR-001).
