import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingBlock } from '@/components/ui/spinner';
import { CompanyDetailView } from '@/features/companies/company-detail-view';

export const metadata: Metadata = { title: 'Company' };

export default function CompanyPage({ params }: PageProps<'/companies/[id]'>) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading company…" />}>
      {params.then(({ id }) => (
        <CompanyDetailView id={Number(id)} />
      ))}
    </Suspense>
  );
}
