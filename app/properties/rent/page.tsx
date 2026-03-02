'use client';

import MainShell from '@/app/_components/manora/MainShell';
import { BuyContent } from '@/app/buy/_components/buy-content';

export default function PropertiesRentPage() {
  return (
    <MainShell>
      <BuyContent offer_type_props="rent" />
    </MainShell>
  );
}
