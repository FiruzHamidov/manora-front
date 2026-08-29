'use client';

export default function BuildingError({ reset }: { reset: () => void }) {
  return <section className="mx-auto max-w-3xl px-4 py-12">
    <h1 className="text-2xl font-bold">Не удалось загрузить жилой комплекс</h1>
    <p className="my-4">Сервис временно недоступен. Это не означает, что ЖК снят с публикации.</p>
    <button className="min-h-11 rounded-xl bg-[#006341] px-5 py-3 text-white" onClick={reset}>Повторить загрузку</button>
  </section>;
}
