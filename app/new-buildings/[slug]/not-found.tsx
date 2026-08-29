import Link from 'next/link';

export default function BuildingNotFound() {
  return <section className="mx-auto max-w-3xl px-4 py-12">
    <h1 className="text-2xl font-bold">Жилой комплекс не найден</h1>
    <p className="my-4">Проверьте ссылку. ЖК может быть снят с публикации.</p>
    <Link href="/new-buildings" className="inline-flex min-h-11 items-center text-[#006341] underline">Вернуться в каталог ЖК</Link>
  </section>;
}
