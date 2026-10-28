import { useState } from 'react'
import { Cat } from '../../components/cat'
import {
  useArchiveExercise,
  useCreateExercise,
  useExercises,
  useMuscleGroups,
  type ExerciseWithGroups,
} from './api'

export function ExercisesScreen() {
  const [showArchived, setShowArchived] = useState(false)
  const muscleGroups = useMuscleGroups()
  const exercises = useExercises(showArchived)

  return (
    <div className="flex flex-col">
      <h1 className="font-display mb-4 text-3xl font-extrabold tracking-tight text-ink-strong">
        Упражнения
      </h1>

      <AddExerciseForm groups={muscleGroups.data ?? []} />

      <div className="mt-6 mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-muted uppercase">Список</h2>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="size-4"
          />
          Показать архив
        </label>
      </div>

      {exercises.isPending ? (
        <p className="text-muted">Загрузка…</p>
      ) : exercises.isError ? (
        <p className="text-danger">Ошибка: {(exercises.error as Error).message}</p>
      ) : exercises.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-sky p-6 text-center">
          <Cat mood="sleepy" size={80} />
          <p className="font-bold text-ink">Пока пусто</p>
          <p className="text-sm text-muted">Заведи первое упражнение в форме выше</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {exercises.data.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </ul>
      )}
    </div>
  )
}

function AddExerciseForm({ groups }: { groups: { id: number; name: string }[] }) {
  const create = useCreateExercise()
  const [name, setName] = useState('')
  const [primaryGroupId, setPrimaryGroupId] = useState<number | ''>('')
  const [secondaryGroupIds, setSecondaryGroupIds] = useState<number[]>([])
  const [isBodyweight, setIsBodyweight] = useState(false)
  const [note, setNote] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  const canSubmit = name.trim() !== '' && primaryGroupId !== '' && !create.isPending

  function toggleSecondary(id: number) {
    setSecondaryGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (primaryGroupId === '') return
    await create.mutateAsync({
      name: name.trim(),
      isBodyweight,
      note: note.trim() || null,
      videoUrl: videoUrl.trim() || null,
      primaryGroupId,
      secondaryGroupIds: secondaryGroupIds.filter((id) => id !== primaryGroupId),
    })
    // Сброс формы после успеха.
    setName('')
    setPrimaryGroupId('')
    setSecondaryGroupIds([])
    setIsBodyweight(false)
    setNote('')
    setVideoUrl('')
  }

  return (
    <form
      onSubmit={submit}
      className="card-shadow flex flex-col gap-3 rounded-2xl bg-surface p-4"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Название упражнения"
        className="min-h-[44px] rounded-xl border-2 border-border bg-paper px-3 text-ink placeholder:text-muted"
      />

      <label className="flex flex-col gap-1 text-sm font-bold text-muted">
        Основная группа
        <select
          value={primaryGroupId}
          onChange={(e) => setPrimaryGroupId(e.target.value === '' ? '' : Number(e.target.value))}
          className="min-h-[44px] rounded-xl border-2 border-border bg-paper px-3 text-ink"
        >
          <option value="">— выбери —</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-1 text-sm font-bold text-muted">
        Вспомогательные группы
        <div className="flex flex-wrap gap-2">
          {groups
            .filter((g) => g.id !== primaryGroupId)
            .map((g) => {
              const on = secondaryGroupIds.includes(g.id)
              return (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => toggleSecondary(g.id)}
                  className={
                    'min-h-[36px] rounded-full border-2 px-3 text-sm font-bold ' +
                    (on
                      ? 'border-brand bg-brand text-white'
                      : 'border-border bg-paper text-ink')
                  }
                >
                  {g.name}
                </button>
              )
            })}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm font-bold text-ink">
        <input
          type="checkbox"
          checked={isBodyweight}
          onChange={(e) => setIsBodyweight(e.target.checked)}
          className="size-4"
        />
        Вес тела (bodyweight)
      </label>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Заметка (настройка тренажёра и т.п.) — необязательно"
        className="min-h-[44px] rounded-xl border-2 border-border bg-paper px-3 text-ink placeholder:text-muted"
      />
      <input
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Ссылка на видео — необязательно"
        className="min-h-[44px] rounded-xl border-2 border-border bg-paper px-3 text-ink placeholder:text-muted"
      />

      {create.isError && (
        <p className="text-sm text-danger">{(create.error as Error).message}</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="min-h-[48px] rounded-xl bg-brand font-extrabold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {create.isPending ? 'Добавляю…' : 'Добавить упражнение'}
      </button>
    </form>
  )
}

function ExerciseCard({ exercise }: { exercise: ExerciseWithGroups }) {
  const archive = useArchiveExercise()
  const primary = exercise.exercise_muscle_groups.find((g) => g.is_primary)?.muscle_groups
  const secondary = exercise.exercise_muscle_groups
    .filter((g) => !g.is_primary)
    .map((g) => g.muscle_groups?.name)
    .filter((n): n is string => Boolean(n))

  return (
    <li className="card-shadow flex items-start justify-between gap-3 rounded-2xl bg-surface p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-ink-strong">{exercise.name}</span>
          {exercise.is_bodyweight && (
            <span className="rounded-full bg-sky px-2 py-0.5 text-xs font-bold text-muted">
              bodyweight
            </span>
          )}
          {exercise.is_archived && (
            <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-muted">в архиве</span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-1 text-xs font-bold">
          {primary && (
            <span className="rounded-full bg-lilac px-2 py-0.5 text-ink">{primary.name}</span>
          )}
          {secondary.map((n) => (
            <span key={n} className="rounded-full bg-paper px-2 py-0.5 text-muted">
              {n}
            </span>
          ))}
        </div>
        {exercise.note && <p className="mt-1 text-sm text-muted">{exercise.note}</p>}
      </div>

      {!exercise.is_archived && (
        <button
          onClick={() => archive.mutate(exercise.id)}
          disabled={archive.isPending}
          className="shrink-0 min-h-[44px] px-2 text-sm text-muted underline disabled:opacity-50"
        >
          В архив
        </button>
      )}
    </li>
  )
}
