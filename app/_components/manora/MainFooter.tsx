import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, Send, Youtube } from 'lucide-react';
import { CONTACT_EMAIL, PRIMARY_CONTACT_PHONE, toTelHref } from '@/constants/contact';

export default function MainFooter() {
  return (
    <footer className="mt-10 pb-24 md:pb-0 bg-[#FFFFFF] rounded-t-[50px]">
      <div className="mx-auto w-full max-w-[1520px]  overflow-hidden   ">
        <div className="grid gap-8 px-6 py-8 md:grid-cols-[1fr_1fr_1fr_1.1fr_auto] md:px-7 md:py-9 md:pt-12 pt-10">
          <div>
            <h3 className="text-[20px] font-extrabold leading-none text-[#2D3554]">Для покупателя</h3>
            <ul className="mt-3 space-y-1.5">
              <li>
                <Link href="/branches" className="text-[16px] leading-[1.2] text-[#2D3554] hover:text-[#0036A5]">
                  Офисы и партнеры
                </Link>
              </li>
              <li>
                <Link href="/cars" className="text-[16px] leading-[1.2] text-[#2D3554] hover:text-[#0036A5]">
                  Автосалоны
                </Link>
              </li>
              <li>
                <Link href="/developers" className="text-[16px] leading-[1.2] text-[#2D3554] hover:text-[#0036A5]">
                  Бренды
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[20px] font-extrabold leading-none text-[#2D3554]">О компании</h3>
            <ul className="mt-3 space-y-1.5">
              <li>
                <Link href="/vacancies" className="text-[16px] leading-[1.2] text-[#2D3554] hover:text-[#0036A5]">
                  Вакансии
                </Link>
              </li>
              <li>
                <Link href="/about/news" className="text-[16px] leading-[1.2] text-[#2D3554] hover:text-[#0036A5]">
                  Блог
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[20px] font-extrabold leading-none text-[#2D3554]">Информация</h3>
            <ul className="mt-3 space-y-1.5">
              <li>
                <Link href="/policy" className="text-[16px] leading-[1.2] text-[#2D3554] hover:text-[#0036A5]">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="/legal" className="text-[16px] leading-[1.2] text-[#2D3554] hover:text-[#0036A5]">
                  Юридическая информация
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[20px] font-extrabold leading-none text-[#2D3554]">Обратная связь</h3>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 inline-block text-[16px] text-[#2D3554] hover:text-[#0036A5]"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-2 text-[16px] leading-[1.2] text-[#2D3554]">
              Если есть вопросы отзывы и предложения
            </p>
            <a
              href={toTelHref(PRIMARY_CONTACT_PHONE)}
              className="mt-2 inline-block text-[38px] font-extrabold leading-none text-[#0036A5]"
            >
              {PRIMARY_CONTACT_PHONE}
            </a>
            <p className="mt-1 text-[16px] text-[#2D3554]">Круглосуточно</p>
          </div>

          <div className="md:justify-self-end">
            <h3 className="text-[20px] font-extrabold leading-none text-[#2D3554]">Скачать приложение</h3>
            <div className="relative mt-3 ml-auto h-[102px] w-[102px] overflow-hidden rounded-[4px] border border-[#D6D9E0] bg-white">
              <Image
                src="/images/qr.png"
                alt="QR код приложения Manora"
                fill
                className="object-cover"
                sizes="102px"
              />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0036A5] text-white"
                aria-label="Instagram"
              >
                <Instagram size={17} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0036A5] text-white"
                aria-label="Facebook"
              >
                <Facebook size={17} />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0036A5] text-white"
                aria-label="Telegram"
              >
                <Send size={17} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0036A5] text-white"
                aria-label="YouTube"
              >
                <Youtube size={17} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#D6D9E0] px-6 py-6 md:px-7">
          <Image
            src="/logo.svg"
            alt="MANORA"
            width={166}
            height={30}
            className="h-7 w-auto"
          />
          <p className="text-[16px] text-[#4B556D]">
            Все права защищены {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
