import {FC} from 'react';
import Image from 'next/image';
import Link from "next/link";

interface ExtraPagesBannerProps {
    title: string;
    description: string;
    buttonLabel: string;
    buttonLink: string;
    imageUrl: string;
    imageAlt: string;
}

export const ExtraPagesBanner: FC<ExtraPagesBannerProps> = ({
                                                                title,
                                                                description,
                                                                buttonLabel,
                                                                buttonLink,
                                                                imageUrl,
                                                                imageAlt,
                                                            }) => {
    return (
        <div className="bg-white rounded-[22px] flex flex-col lg:flex-row gap-6 lg:gap-[100px] p-6 lg:p-0 overflow-hidden">
            <div className="lg:pt-10 lg:pb-[100px] lg:pl-[58px] text-left">
                <h2 className="mb-4 lg:mb-5 font-bold text-2xl lg:text-[40px]">
                    {title}
                </h2>
                <p className="mb-6 lg:mb-10 font-normal text-[#353E5C] text-lg lg:text-2xl">
                    {description}
                </p>
                <div className="lg:hidden mb-6">
                    <Image
                        src={imageUrl}
                        alt={imageAlt}
                        width={455}
                        height={455}
                        className="w-64 h-64 mx-auto object-cover rounded-lg"
                    />
                </div>
                <Link
                    href={buttonLink}>
                    <button
                        className="bg-[#0036A5] cursor-pointer rounded-full px-8 lg:px-11 py-4 lg:py-[21px] text-white hover:bg-blue-800 transition-colors text-base lg:text-lg w-full lg:w-auto">
                        {buttonLabel}
                    </button>
                </Link>
            </div>
            <div className="hidden lg:block relative max-w-[512px] min-w-[440px]">
                <div className="absolute top-28 inset-0 w-[455px] h-[455px] bg-[#F0F2F5] rounded-full"/>

                <Image
                    src={imageUrl}
                    alt={imageAlt}
                    width={455}
                    height={455}
                    className="z-10 relative mt-10"
                />

            </div>
        </div>
    );
};
