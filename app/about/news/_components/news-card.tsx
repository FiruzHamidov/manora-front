import Image from 'next/image';
import Link from 'next/link';

interface NewsCardProps {
  title: string;
  date: string;
  imageUrl: string;
  href: string;
}

const NewsCard = ({ title, date, imageUrl, href }: NewsCardProps) => {
  return (
    <Link href={href}>
      <div className="relative w-full h-[363px] rounded-[22px] overflow-hidden group cursor-pointer">
        {/* Background image */}
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2 className="font-bold mb-1 leading-tight">{title}</h2>
          <p className="text-sm font-normal">{date}</p>
        </div>
      </div>
    </Link>
  );
};

export default NewsCard;
