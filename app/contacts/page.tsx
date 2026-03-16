import { Instagram } from 'lucide-react';
import { COMPANY_INSTAGRAM_URL, CONTACT_EMAIL, CONTACT_PHONES, toTelHref } from '@/constants/contact';

export default function ContactsPage() {
  const socials = [
    {
      name: 'Instagram',
      href: COMPANY_INSTAGRAM_URL,
      Icon: Instagram,
      color: 'bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    },
  ];

  return (
    <main className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f172a]">Контакты</h1>
      <p className="mt-3 text-slate-600 max-w-2xl">
        Свяжитесь с нами по телефону, email или через Instagram. Мы на связи ежедневно.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Кол-центр</div>
          {CONTACT_PHONES.length > 0 ? (
            CONTACT_PHONES.map((phone) => (
              <a key={phone} href={toTelHref(phone)} className="mt-1 block text-lg font-bold text-slate-900">
                {phone}
              </a>
            ))
          ) : (
            <div className="mt-1 block text-lg font-bold text-slate-900">—</div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Email</div>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 block text-lg font-bold text-slate-900">
            {CONTACT_EMAIL}
          </a>
          <div className="mt-4 text-sm text-slate-500">Адрес</div>
          <div className="mt-1 text-base font-semibold text-slate-900">г. Душанбе, ул. Айни 9</div>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Мы в соцсетях</h2>
        <p className="mt-1 text-slate-600">Подписывайтесь на нас и следите за новыми объявлениями</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {socials.filter((social) => Boolean(social.href)).map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-slate-200 px-3 py-3 hover:shadow-sm transition-all"
            >
              <div className={`mx-auto h-12 w-12 rounded-full ${social.color} flex items-center justify-center`}>
                <social.Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="mt-2 text-center text-sm font-semibold text-slate-800 group-hover:text-[#0036A5]">
                {social.name}
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
