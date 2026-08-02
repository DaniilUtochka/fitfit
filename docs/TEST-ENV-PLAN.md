# План: тестовое окружение (v2, ужатый скоуп)

Статус: draft, не реализовано · Дата: 2026-08-02 · Требования: PRD.md · Схема: DATA-MODEL.md

## Зачем

CLAUDE.md обещает `npm test` на vitest, но vitest в `package.json` отсутствует, тестов ноль. Definition of Done для Слайса 5 (ratchet) требует unit-тесты — без каркаса слайс не закрыть. Скоуп v1 — только это: поднять vitest, написать первый настоящий тест, обеспечить прогон через субагента. Ничего больше.

## Принятые решения (v2)

| Развилка | Решение | Отвергнутые варианты |
| --- | --- | --- |
| Изоляция базы | Оставить как есть — работаем против боевого Supabase | Локальный `supabase start`; staging-проект; Supabase Branching. Уходим в парковку, при первой боли — поднимаем. Держимся на free tier Vercel + Supabase. |
| Вход при тестировании | Google OAuth как сейчас | Тестовый юзер email+пароль в DEV-сборке. Отложено — Слайс 4 полезем в тренировки, там разберёмся, нужно ли |
| Глубина тестов v1 | Unit (чистые функции) + смоук A+C (рендер `<App/>` и сборка supabase-клиента) | Интеграционные RLS против локального Postgres; snapshot; health-check прод-Supabase скриптом |
| Обеспечение правил | Субагент `test-runner` | Stop-хук в `.claude/settings.json`; GitHub Actions на PR — в парковку |

## Ограничения (осознанные)

- Ветки тестируем на боевой Supabase — риск порчи истории тренировок реален. Смягчение: работа только в ветках `slice-N-*`/`fix/*`, мерж в main только на зелёном `npm run check`, миграции с деструктивными эффектами (drop, alter) — руками с оглядкой на бэкап Supabase.
- Vercel Preview деплой ветки смотрит в **боевую** Supabase. Preview на iPhone — по-прежнему может испортить данные. Не гонять Preview на риск.
- Проверка с айфона — только через прод (боевой Vercel + боевой Supabase). Локальный `npm run dev` — только для десктопа.

---

## 1. Vitest + первый тест

**devDependencies:** `vitest` (пиньнуть текущий major под vite@8).

**devDependencies (для смоука):** `jsdom`, `@testing-library/react`.

**vite.config.ts:** `/// <reference types="vitest/config" />`, импорт `defineConfig` из `vitest/config`, блок:

```ts
test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] }
```

(Единый `jsdom` для всех тестов — оверхед для чистой логики микроскопический, зато конфиг простой.)

**Первый тест — не заглушка:** вынести из `src/features/exercises/api.ts` (сейчас строки 73-78) чистую функцию в новый `src/features/exercises/logic.ts`:

```ts
buildMuscleGroupLinks(exerciseId, primaryGroupId, secondaryGroupIds)
```

`src/features/exercises/logic.test.ts` покрывает:
- primary всегда попадает с `is_primary: true`;
- primary, продублированный в secondary, не даёт второй строки (иначе ловим unique index `exercise_muscle_groups_one_primary_idx`);
- пустой список secondary даёт одну строку.

`api.ts` начинает использовать эту функцию.

**Скрипты в `package.json`:**

- `test` → `vitest run`
- `test:watch` → `vitest`
- `check` → `tsc -b && oxlint && vitest run`

**Смысл:** каркас готов к Слайсу 5. Логика ratchet ляжет в такой же `logic.ts` рядом (`src/features/workout/logic.ts` — вычисление плана следующей сессии, ratchet вверх, симметрия для bodyweight).

## 2. Субагент test-runner

Новый `.claude/agents/test-runner.md`:

- frontmatter: `name: test-runner`, `description` (когда вызывать), `tools: Bash, Read, Grep, Glob`, `model: sonnet`.
- Задача: `npm run check`, короткий отчёт — прошло/упало, для падений `файл:строка` + одна строка диагноза.
- **Ничего не чинит и не редактирует файлы**: разделение «диагноз» и «лечение» не даёт агенту молча переписать тест под баг.
- Смысл именно субагента: вывод `tsc` + `oxlint` + `vitest` шумный, в отдельном контексте он не забивает основной.

## 3. Правила в CLAUDE.md

Добавить раздел «Git-процесс»:

- Работа только в ветках: `slice-N-<тема>` для слайсов, `fix/<тема>` для правок. Прямой коммит в `main` — нет.
- Мерж в `main` только после зелёного `npm run check` (руками или через субагента `test-runner`).
- Параллельная работа — через `git worktree`, чтобы две ветки не дрались за один рабочий каталог.

Добавить в «Definition of Done»: после любых изменений кода — `npm run check`, мерж только на зелёном.

Исправить фактические расхождения:

- В блоке «Команды» `npm test` описан как существующий — станет правдой после этой работы. Добавить `npm run check`.
- Правило 6 переформулировать точнее: «на фронте только anon key; service_role — никогда и нигде, включая скрипты и локальные тулы».

## 4. Мелочи

**`supabase/config.toml:71`** — `sql_paths = ["./seed.sql"]`. Файла нет, мы не сеидим SQL-ом. Оставлять смысла нет.

Два варианта:
- Закомментировать строку (мягко, легко вернуть). **Рекомендую.**
- Отключить блок: `[db.seed] enabled = false`.

Риск: нулевой. Если позже понадобится seed SQL-ом (например, для локального стека из парковки) — вернуть строку и положить `seed.sql`. Никакой другой код на этот файл не завязан.

---

## Файлы

**Новые:** `src/features/exercises/logic.ts`, `src/features/exercises/logic.test.ts`, `src/App.test.tsx`, `src/lib/supabase.test.ts`, `.claude/agents/test-runner.md`

**Меняем:** `package.json` (scripts + vitest/jsdom/@testing-library/react в devDeps), `vite.config.ts` (блок `test`), `src/features/exercises/api.ts` (использует `buildMuscleGroupLinks`), `CLAUDE.md`, `supabase/config.toml` (комментим `sql_paths`)

**Не трогаем:** миграции, `vercel.json`, настройки боевого Supabase, `src/App.tsx` (никакого TestLogin в v1).

## Проверка

1. `npm install` — vitest/jsdom/@testing-library/react ставятся, конфликтов с vite@8 нет.
2. `npm test` — зелёный (unit `buildMuscleGroupLinks` + смоук App + смоук supabase-клиента), прогон < 2 сек. Временно сломать `buildMuscleGroupLinks` → падает точечно.
3. `npm run check` — `tsc -b && oxlint && vitest run`, всё зелёное.
4. `npm run build` — сборка не сломалась.
5. Вызвать субагента `test-runner` — возвращает короткий отчёт, файлы не редактирует.
6. Работа в ветке `slice-test-env`, финал — draft PR, мерж в main вручную после ревью.

---

## 5. Смоук-тесты (baseline «сервис жив»)

Два теста, оба через vitest, окружение `jsdom` (только для смоука App, unit-тесты остаются в `node`).

**A. Рендер `<App />` без падения.** `src/App.test.tsx`. Мок `supabase.auth.getSession` возвращает `{ data: { session: null } }`. Mount, ассерт что render не бросил и в DOM появился текст «FitFit» (экран логина). Ловит: сломанный импорт, ошибку в JSX, top-level регрессию, развалившийся Login/react-router. Стоимость: `jsdom`, `@testing-library/react` в devDeps, ~500-800ms.

**C. Supabase-клиент собирается.** `src/lib/supabase.test.ts`. Импорт `{ supabase }`, ассерт: не бросило, `typeof supabase.from === 'function'`, `typeof supabase.auth === 'object'`. Ловит: сломанные env, breaking-change в supabase-js. Быстро (<100ms), без RTL/jsdom.

**Vite config** — два блока include: unit-логика в `node`, смоук в `jsdom`. Проще всего — оставить один блок `environment: 'jsdom'` и жить с этим (стоимость лишнего jsdom для чистой логики — микросекунды). Пойдём так.

**Не берём:**
- B (роутинг с активной сессией) — покрывается A частично, отдельно не платит за пару секунд.
- D (health-check прод-Supabase) — избыточен для соло-проекта, руками замечу быстрее чем настраивать скрипт.
- E (snapshot) — шум-тест, ломается при любом рефакторе.

## Парковка (обсуждали, решили не делать сейчас)

- Локальный стек Supabase (`supabase start`) + идемпотентный сид + `db:reset`/`db:seed` скрипты.
- Тестовый вход без Google (DEV-only TestLogin, `VITE_TEST_AUTOLOGIN`).
- Staging-проект `fitfit-staging` на free tier + отдельные env vars для Vercel Preview.
- Supabase Branching (Pro).
- Интеграционные тесты RLS против локального Postgres.
- Stop-хук в `.claude/settings.json` на автозапуск `npm run check`.
- GitHub Actions на PR (tsc + lint + тесты + проверка миграций).
- E2E (Playwright).
- Snapshot-тесты (RTL).
- Health-check прод-Supabase (`scripts/health.mjs` с curl на REST endpoint) — избыточен для соло-проекта.
- Смоук роутинга с активной сессией (вариант B из обсуждения) — покрывается частично рендером Login-экрана в смоуке A.
