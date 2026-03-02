import { axios } from '@/utils/axios';
import { SelectionPublic } from '@/services/selection/selection';
import SelectionView from '@/app/_components/selection/SelectionView';
import { Property } from '@/services/properties/types';
import Link from "next/link";
import { isAxiosError } from "axios";

// --- lightweight inline UI states (no new files)
function NotFoundState() {
  return (
    <div className="mx-auto max-w-3xl p-8 text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-gray-200" />
      <h1 className="mb-2 text-2xl font-semibold">Подборка не найдена</h1>
      <p className="text-gray-500">Похоже, ссылка устарела или была удалена.</p>
      <Link href="/" className="mt-6 inline-block rounded-md border px-4 py-2">На главную</Link>
    </div>
  );
}

function ErrorState({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-3xl p-8 text-center">
      <svg className="mx-auto mb-4 h-12 w-12 animate-spin" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" fill="none" opacity="0.2" />
        <path d="M22 12a10 10 0 0 1-10 10" strokeWidth="4" stroke="currentColor" fill="none" />
      </svg>
      <h1 className="mb-2 text-2xl font-semibold">Упс… что-то пошло не так</h1>
      <p className="text-gray-500">{message ?? 'Попробуйте обновить страницу чуть позже.'}</p>
      <Link href="/" className="mt-6 inline-block rounded-md border px-4 py-2">На главную</Link>
    </div>
  );
}

// NOTE: Next 15 types PageProps as { params?: Promise<any> }
type Params = { hash: string };

export default async function SelectionPage({ params }: { params?: Promise<Params> }) {
  if (!params) {
    throw new Error('Route params are missing');
  }
  const { hash } = await params;

  // 1) Получаем подборку по hash с защитой от 404 и сетевых ошибок
  let selection: SelectionPublic | null = null;
  try {
    const { data } = await axios.get<SelectionPublic>(`/selections/public/${hash}`);
    selection = data;
  } catch (e: unknown) {
    // Axios 404 -> показываем NotFoundState, остальные ошибки -> ErrorState
    if (isAxiosError(e)) {
      const status = e.response?.status;
      if (status === 404) {
        return <NotFoundState />;
      }
      const msg = e.message || 'Ошибка загрузки подборки';
      return <ErrorState message={msg} />;
    }
    return <ErrorState message="Неизвестная ошибка загрузки" />;
  }

  // 2) Безопасно грузим объекты по id; пропускаем те, что не отдались
  const ids = Array.isArray(selection?.property_ids) ? selection!.property_ids : [];

  const results = await Promise.allSettled(
    ids.map(async (id) => {
      const { data } = await axios.get<Property>(`/properties/${id}`);
      return data;
    })
  );

  const propsList: Property[] = results
    .filter((r): r is PromiseFulfilledResult<Property> => r.status === 'fulfilled')
    .map((r) => r.value);

  // 3) Если в подборке нет активных объектов — тоже вежливо показываем состояние
  if (!propsList.length) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-gray-200" />
        <h1 className="mb-2 text-2xl font-semibold">В подборке пока нет объектов</h1>
        <p className="text-gray-500">Владелец мог их удалить или скрыть.</p>
        <Link href="/" className="mt-6 inline-block rounded-md border px-4 py-2">На главную</Link>
      </div>
    );
  }

  return <SelectionView selection={selection!} initialProperties={propsList} />;
}