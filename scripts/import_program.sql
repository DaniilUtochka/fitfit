-- ═══════════════════════════════════════════════════════════════════════════════════
-- Слайс 7 — Импорт программы тренировок из Google-таблицы. РАЗОВЫЙ СКРИПТ (не миграция).
-- Дата: 2026-10-29. Источник: Google-таблица программы (CSV-дамп), 7-недельная программа,
-- колонки недель 1–7 проигнорированы; разбивка по дням Push/Pull/Legs согласована
-- с пользователем. Выполняется через MCP supabase (execute_sql) — только DML,
-- схему не меняет (правило 1 CLAUDE.md).
--
-- Правила разбора (согласованы):
--   * имена очищены от весов, вес в план дня = нижняя граница диапазона;
--   * диапазоны повторов → нижняя граница (3×8–12 → sets 3, reps 8);
--   * «Гребной тренажер» (10 мин) → 1×10, is_bodyweight, заметка «Кардио: 10 минут»;
--   * HALO и паллоф-пресс — без веса, is_bodyweight = true;
--   * тяга гантели одной рукой и подъёмы на носки — вес в плане null
--     (CHECK-и схемы не требуют вес для не-bodyweight), is_bodyweight = false;
--   * дубликаты из таблицы (махи, паллоф-пресс, гребной) — одно упражнение,
--     разные позиции плана в разных днях (unique template_id+exercise_id соблюдён).
--
-- Переиспользуем существующее: 3 дня Push/Pull/Legs уже в базе (слайс 3), в них есть
-- история сессий — вставляем план в них же, не создавая новые дни. В Legs позиции
-- 1–2 заняты старыми тестовыми позициями — новые идут с 3.
-- ═══════════════════════════════════════════════════════════════════════════════════

-- user_id владельца (единственный пользователь, exercises со слайса 2)
-- 55286eeb-e2c9-4f79-bca1-a8dff917ca21

-- ── 1. Упражнения (17 уникальных; совпадений с существующим справочником нет) ────────
insert into exercises (id, user_id, name, is_bodyweight, note) values
  -- Push
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d01', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'HALO', true, null),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d02', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Жим гантелей лёжа', false, 'Диапазон веса в исходной таблице: 12–14 кг'),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d03', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Жим гантелей на наклонной 30°', false, 'Скамья 30°'),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d04', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Махи гантелями в стороны', false, null),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d05', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Разгибания на трицепс на блоке (канат)', false, null),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d06', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Паллоф-пресс на блоке', true, null),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d07', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Гребной тренажер', true, 'Кардио: 10 минут. Повторы здесь = минуты'),
  -- Pull
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d08', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Тяга верхнего блока к груди', false, 'Диапазон веса в исходной таблице: 35–42 кг'),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d09', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Тяга горизонтального блока', false, 'Диапазон веса в исходной таблице: 35–42 кг'),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0a', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Тяга гантели одной рукой в наклоне', false, 'Вес не указан в программе — задать руками в плане дня'),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0b', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Разведения гантелей в наклоне сидя', false, null),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0c', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Сгибания на бицепс на блоке (EZ)', false, null),
  -- Legs
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0d', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Жим ногами', false, 'Диапазон веса в исходной таблице: 80–90 кг'),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0e', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Hip thrust (штанга или Смит)', false, null),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0f', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Гоблет-присед', false, 'Диапазон веса в исходной таблице: 16–22 кг'),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d10', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Сгибания ног в тренажёре (лёжа/сидя)', false, null),
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d11', '55286eeb-e2c9-4f79-bca1-a8dff917ca21', 'Подъёмы на носки (в жиме ногами или стоя)', false, 'Вес не указан в программе — задать руками в плане дня');

-- ── 2. Мышечные группы (только существующие id справочника, новых не создаём) ────────
insert into exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) values
  -- HALO: подвижность плечевого пояса
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d01', 4, true),  -- Плечи
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d01', 7, false),  -- Кор
  -- Жим гантелей лёжа
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d02', 1, true),   -- Грудь
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d02', 6, false),  -- Трицепс
  -- Жим гантелей на наклонной 30°
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d03', 1, true),   -- Грудь
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d03', 4, false),  -- Плечи
  -- Махи гантелями в стороны
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d04', 4, true),   -- Плечи
  -- Разгибания на трицепс на блоке (канат)
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d05', 6, true),   -- Трицепс
  -- Паллоф-пресс на блоке
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d06', 7, true),   -- Кор
  -- Гребной тренажер (кардио, но тяговый паттерн)
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d07', 2, true),   -- Спина
  -- Тяга верхнего блока к груди
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d08', 2, true),   -- Спина
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d08', 5, false),  -- Бицепс
  -- Тяга горизонтального блока
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d09', 2, true),   -- Спина
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d09', 5, false),  -- Бицепс
  -- Тяга гантели одной рукой в наклоне
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0a', 2, true),   -- Спина
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0a', 5, false),  -- Бицепс
  -- Разведения гантелей в наклоне сидя (задняя дельта)
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0b', 4, true),   -- Плечи
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0b', 2, false),  -- Спина
  -- Сгибания на бицепс на блоке (EZ)
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0c', 5, true),   -- Бицепс
  -- Жим ногами
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0d', 3, true),   -- Ноги
  -- Hip thrust (ягодицы; отдельной группы нет → Ноги)
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0e', 3, true),   -- Ноги
  -- Гоблет-присед
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0f', 3, true),   -- Ноги
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0f', 7, false),  -- Кор
  -- Сгибания ног в тренажёре (лёжа/сидя)
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d10', 3, true),   -- Ноги
  -- Подъёмы на носки (в жиме ногами или стоя)
  ('3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d11', 3, true);   -- Ноги

-- ── 3. План по дням. Дни уже существуют (слайс 3) — берём по имени, не создаём новых.
--       В Legs позиции 1–2 заняты старыми позициями, новые — с 3. ─────────────────────

-- Push (7 позиций)
insert into template_exercises (template_id, exercise_id, position, sets_planned, reps_planned, weight)
select d.id, x.exercise_id, x.position, x.sets_planned, x.reps_planned, x.weight
from (values
  (1, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d01'::uuid, 3, 12, null::numeric),  -- HALO
  (2, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d02'::uuid, 3, 8,  12),             -- Жим гантелей лёжа
  (3, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d03'::uuid, 3, 12, 10),             -- Жим на наклонной 30°
  (4, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d04'::uuid, 4, 12, 5),              -- Махи в стороны
  (5, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d05'::uuid, 3, 12, 12.5),           -- Трицепс на блоке (канат)
  (6, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d06'::uuid, 3, 12, null),           -- Паллоф-пресс
  (7, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d07'::uuid, 1, 10, null)            -- Гребной тренажер
) as x(position, exercise_id, sets_planned, reps_planned, weight)
join day_templates d on d.user_id = '55286eeb-e2c9-4f79-bca1-a8dff917ca21' and d.name = 'Push';

-- Pull (6 позиций)
insert into template_exercises (template_id, exercise_id, position, sets_planned, reps_planned, weight)
select d.id, x.exercise_id, x.position, x.sets_planned, x.reps_planned, x.weight
from (values
  (1, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d08'::uuid, 3, 10, 35),   -- Тяга верхнего блока к груди
  (2, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d09'::uuid, 3, 10, 35),   -- Тяга горизонтального блока
  (3, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0a'::uuid, 3, 10, null), -- Тяга гантели одной рукой
  (4, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d04'::uuid, 3, 12, 5),    -- Махи в стороны
  (5, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0b'::uuid, 3, 15, 5),    -- Разведения в наклоне сидя
  (6, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0c'::uuid, 3, 12, 7.5)   -- Бицепс на блоке (EZ)
) as x(position, exercise_id, sets_planned, reps_planned, weight)
join day_templates d on d.user_id = '55286eeb-e2c9-4f79-bca1-a8dff917ca21' and d.name = 'Pull';

-- Legs (7 позиций, с 3-й — 1–2 заняты существующими)
insert into template_exercises (template_id, exercise_id, position, sets_planned, reps_planned, weight)
select d.id, x.exercise_id, x.position, x.sets_planned, x.reps_planned, x.weight
from (values
  (3, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0d'::uuid, 3, 10, 80),   -- Жим ногами
  (4, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0e'::uuid, 3, 10, 40),   -- Hip thrust
  (5, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d0f'::uuid, 3, 12, 16),   -- Гоблет-присед
  (6, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d10'::uuid, 3, 12, 20),   -- Сгибания ног в тренажёре
  (7, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d11'::uuid, 4, 12, null), -- Подъёмы на носки
  (8, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d06'::uuid, 3, 12, null), -- Паллоф-пресс
  (9, '3f8b1c2d-9e4a-4b7c-8d1e-5f2a3b4c5d07'::uuid, 1, 10, null)  -- Гребной тренажер
) as x(position, exercise_id, sets_planned, reps_planned, weight)
join day_templates d on d.user_id = '55286eeb-e2c9-4f79-bca1-a8dff917ca21' and d.name = 'Legs';
