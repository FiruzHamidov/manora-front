export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f172a]">Часто задаваемые вопросы</h1>

      <div className="mt-8 space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Как разместить объявление?</h2>
          <p className="mt-2 text-slate-600">
            Авторизуйтесь в личном кабинете и добавьте объект через раздел "Добавить объявление".
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Можно ли заказать консультацию?</h2>
          <p className="mt-2 text-slate-600">
            Да, оставьте заявку в форме на сайте или свяжитесь с кол-центром.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">В каких городах вы работаете?</h2>
          <p className="mt-2 text-slate-600">
            Актуальные филиалы и адреса доступны на странице "Филиалы".
          </p>
        </section>
      </div>
    </main>
  );
}

