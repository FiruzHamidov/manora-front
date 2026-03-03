import Link from 'next/link';
import Image from 'next/image';
import FacebookIcon from '@/icons/FacebookIcon';
import InstagramIcon from '@/icons/InstagramIcon';
import WhatsAppIcon from '@/icons/Whatsapp';
import YouTubeIcon from '@/icons/YoutubeIcon';
import FooterPhoneIcon from '@/icons/FooterPhoneIcon';
import EmailIcon from '@/icons/EmailIcon';
import { CONTACT_EMAIL, CONTACT_PHONES, CONTACT_WHATSAPP_URL, toTelHref } from '@/constants/contact';

interface FooterLink {
  name: string;
  href: string;
}

interface LinkColumn {
  title: string;
  links: FooterLink[];
}

const footerLinks: LinkColumn[] = [
  {
    title: 'О нас',
    links: [
      { name: 'Филиалы', href: '/branches' },
      // { name: 'Реклама', href: '/advertising' },
      { name: 'Контакты', href: '/contacts' },
      { name: 'Часто задаваемые вопросы', href: '/faq' },
    ],
  },
  {
    title: 'Услуги',
    links: [
      { name: 'Срочный выкуп', href: '/buy-property' },
      { name: 'Ипотека', href: '/mortgage' },
      { name: 'Ремонт под ключ', href: '/repair' },
      { name: 'Дизайнерские услуги', href: '/design' },
      { name: 'Оформление документов', href: '/document-registration' },
      { name: 'Клининговые услуги', href: '/cleaning' },
    ],
  },
];

const footerNav = [
  { name: 'Главная', href: '/' },
  { name: 'Объявления', href: '/listings' },
  // { name: 'Реклама', href: '/' },
  { name: 'Политика', href: '/policy' },
  { name: 'Сервисы', href: '/partners' },
  { name: 'Филиалы', href: '/branches' },
  { name: 'Контакты', href: '/contacts' },
];

const socialMedia = [
  {
    Icon: FacebookIcon,
    href: 'https://www.facebook.com/manora.tj',
    label: 'Facebook',
  },
  {
    Icon: InstagramIcon,
    href: 'https://www.instagram.com/aura_estate_/',
    label: 'Instagram',
  },
  {
    Icon: WhatsAppIcon,
    href: CONTACT_WHATSAPP_URL,
    label: 'WhatsApp',
  },
  {
    Icon: YouTubeIcon,
    href: 'https://www.youtube.com/channel/UCFqrFmI0ha2CKYM3zUuGQCg',
    label: 'YouTube',
  },
];

const Footer = () => {
  return (
    <footer className="bg-[#12213A] text-white md:mb-0">
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 md:mb-12">
          {/* First Column - Address */}
          <div>
            <h3 className="text-2xl font-bold mb-[22px]">Наш адрес</h3>
            <div className="space-y-[14px]">
              <p className="text-sm text-[#B2C3E4]">Головной офис:</p>
              <p>г.Душанбе ул. Айни 9</p>
              <p>Республика Таджикистан</p>
              <p>743000</p>
            </div>
          </div>

          {/* Middle Columns - Links */}
          {footerLinks.map((column, colIndex) => (
            <div key={`col-${colIndex}`}>
              <h3 className="text-2xl font-bold mb-[26px]">{column.title}</h3>
              <ul className="space-y-4">
                {column.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-white hover:opacity-80 transition-opacity"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Column */}
          <div>
            <h3 className="text-xl font-bold mb-6">Связь с нами</h3>

            <div className="flex items-center justidy-center mb-6">
              <div className="mr-3">
                <FooterPhoneIcon className="w-9 h-9" />
              </div>
              <div>
                <p className="text-sm text-[#B2C3E4]">кол центр</p>
                {CONTACT_PHONES.length > 0 ? (
                  CONTACT_PHONES.map((phone) => (
                    <a key={phone} href={toTelHref(phone)}>
                      <p className="font-bold text-lg">{phone}</p>
                    </a>
                  ))
                ) : (
                  <p className="font-bold text-lg">—</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <div className="mr-3">
                <EmailIcon className="w-9 h-9" />
              </div>
              <div>
                <p className="text-sm text-[#B2C3E4]">email</p>
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  <p className="font-bold text-lg">{CONTACT_EMAIL}</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t border-gray-700/50" />

      {/* Bottom Section */}
      <div className="w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 mx-auto py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.svg"
                alt="Manora"
                width={135}
                height={48}
                className="h-12 w-[135px] brightness-0 invert"
              />
            </Link>
          </div>

          <div className="mb-6 md:mb-0">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {footerNav.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-white hover:opacity-80 transition-opacity"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex space-x-4">
            {socialMedia.filter((social) => Boolean(social.href)).map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="rounded-full inline-flex items-center justify-center"
              >
                <social.Icon className="h-10 w-10 text-white hover:opacity-80 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
