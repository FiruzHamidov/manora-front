import Image from 'next/image';
import { FC } from 'react';

interface WhyUsItem {
  image: string;
  description: string;
}

interface WhyUsProps {
  title: string;
  items: WhyUsItem[];
}

export const WhyUs: FC<WhyUsProps> = ({ title, items }) => {
  return (
    <div className="bg-white rounded-[22px] py-6 px-6 md:py-10 md:px-[58px]">
      <h2 className="font-bold text-2xl md:text-4xl mb-6 md:mb-[30px]">
        {title}
      </h2>

      <div className="flex flex-col md:flex-row md:justify-between gap-6 md:gap-[90px]">
        {items?.map((item, index) => (
          <div key={index} className="flex-1">
            <Image
              src={item.image}
              alt={item.description}
              width={144}
              height={144}
              className="mb-3 md:mb-1.5 mx-auto w-20 h-20 md:w-36 md:h-36 object-contain"
            />
            <p className="text-[#353E5C] text-base md:text-lg text-center leading-5 md:leading-normal">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
