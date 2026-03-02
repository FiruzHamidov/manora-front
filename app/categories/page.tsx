import MainShell from '@/app/_components/manora/MainShell';

export default function CategoriesPage() {
  return (
    <MainShell>
      <section className="mx-auto w-full max-w-[1520px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
          <h1 className="text-2xl font-extrabold text-[#111827]">Другие категории</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            Раздел в разработке. Здесь появится список всех дополнительных категорий объявлений.
          </p>
        </div>
      </section>
    </MainShell>
  );
}
