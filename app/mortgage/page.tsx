import { ExtraPagesBanner } from '../_components/extra-pages-banner';
import MortgageCalculator from '../apartment/[slug]/_components/MortgageCalculator';
import GoogleAdSlot from '@/app/_components/ads/GoogleAdSlot';

export default function Mortgage() {
  return (
    <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 lg:px-8 pt-10 pb-16">
      <ExtraPagesBanner
        title="Ипотека"
        description="Планируйте покупку жилья с умом - рассчитайте ипотеку заранее и принимайте взвешенные финансовые решения."
        buttonLabel="Рассчитать ипотеку"
        buttonLink="/mortgage#calculator"
        imageUrl="/images/extra-pages/mortgage.png"
        imageAlt="Ипотека"
      />
      <div className="my-8 md:my-10 bg-white rounded-[22px] p-4 md:p-6">
        <GoogleAdSlot
          slot="2404125144"
          format="auto"
          fullWidthResponsive="true"
        />
      </div>
      <MortgageCalculator id={'calculator'} propertyPrice={450000} />
    </div>
  );
}
