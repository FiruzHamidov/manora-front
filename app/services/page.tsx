import Services from "@/app/_components/services";
import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';

export default function Team() {
  return (
    <div className="md:pt-[69px] pb-14 md:pb-[116px]">
        <div className="lg:mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 mx-auto">
            <Services variant="grid" />
        </div>
        <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 mt-8 md:mt-10">
            <div className="bg-white rounded-[22px] p-4 md:p-6">
                <GoogleAdSlot
                    slot="5085881730"
                    format="auto"
                    fullWidthResponsive="true"
                    layout="in-article"
                />
            </div>
        </div>
    </div>
  );
}
