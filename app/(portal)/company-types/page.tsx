import type { Metadata } from 'next';
import { CompanyTypesView } from '@/features/company-types/company-types-view';

export const metadata: Metadata = { title: 'Company types' };

export default function CompanyTypesPage() {
  return <CompanyTypesView />;
}
