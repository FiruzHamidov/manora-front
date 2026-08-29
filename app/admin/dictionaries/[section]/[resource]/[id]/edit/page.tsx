import { notFound } from 'next/navigation';
import ResidentialDictionaryEditor from '@/app/admin/new-buildings/_components/ResidentialDictionaryEditor';

export default async function GeographyEditPage({ params }: { params: Promise<{ section: string; resource: string }> }) {
  const { section, resource } = await params;
  if (section !== 'geography' || (resource !== 'locations' && resource !== 'districts')) notFound();
  return <ResidentialDictionaryEditor resource={resource} />;
}
