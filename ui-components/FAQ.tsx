import { FC } from 'react';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';
import BigPlusIcon from '@/icons/BigPlusIcon';
import MinusIcon from '@/icons/MinusIcon';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

export const FAQ: FC<FAQProps> = ({ items }) => {
  return (
    <div>
      <h2 className="font-bold text-2xl md:text-[32px] mb-6 md:mb-10">
        Часто задаваемые вопросы (FAQ)
      </h2>

      {items.map((item, index) => (
        <Disclosure
          as="div"
          key={index}
          className={`bg-white px-6 md:px-10 py-6 md:py-[27px] rounded-xl ${
            index === items.length - 1 ? 'mb-0' : 'mb-4 md:mb-5'
          }`}
        >
          <DisclosureButton className="group flex w-full items-center justify-between text-left">
            <h3 className="md:text-xl text-gray-900 group-data-[open]:font-bold transition-all duration-300 pr-4">
              {item.question}
            </h3>
            <BigPlusIcon className="size-[46px] group-data-open:hidden flex-shrink-0" />
            <MinusIcon className="size-[46px] group-data-[open]:block hidden flex-shrink-0" />
          </DisclosureButton>
          <DisclosurePanel className="mt-3 md:mt-4 text-sm md:text-lg text-gray-700">
            <p>{item.answer}</p>
          </DisclosurePanel>
        </Disclosure>
      ))}
    </div>
  );
};
