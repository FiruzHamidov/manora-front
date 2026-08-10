import { notFound } from 'next/navigation';
import DictionariesSectionPage, {
  type DictionarySection,
} from '../_components/DictionariesSectionPage';

const sectionBySlug: Record<string, DictionarySection> = {
  'real-estate': 'Недвижимость',
  geography: 'География',
  transport: 'Транспорт',
  organization: 'Организация',
  'new-buildings': 'Новостройки',
};

export default async function DictionarySectionRoute({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const selectedSection = sectionBySlug[section];

  if (!selectedSection) notFound();

  return <DictionariesSectionPage section={selectedSection} />;
}
