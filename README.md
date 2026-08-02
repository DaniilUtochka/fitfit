# FitFit

PWA-трекер тренировок на одного пользователя. Для iPhone, использование в зале между подходами.

Документы — в `docs/` (`PRD.md`, `ADR-001-stack.md`, `DATA-MODEL.md`, `BACKLOG.md`),
правила и стиль работы — в `CLAUDE.md`.

## Стек

Vite + React + TypeScript (strict), PWA. Бэкенд — Supabase (Postgres + Auth + RLS).
Хостинг — Vercel (деплой через git push).

## Команды

```bash
npm run dev            # локально
npm run build          # прод-сборка (tsc + vite)
npm run preview        # проверка прод-сборки
npm run lint           # oxlint
npx supabase migration new <name>   # новая миграция
npx supabase db push                # применить миграции к проекту
```

## Настройка окружения

Скопируй `.env.example` → `.env.local` и заполни значениями из Supabase
(только anon key, никогда service_role).

## Статус

Слайс 0 — ходячий скелет. Порядок работы — `docs/BACKLOG.md`.
