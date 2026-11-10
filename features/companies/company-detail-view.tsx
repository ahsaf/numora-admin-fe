'use client';

import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import {
  Alert,
  ArrowLeftIcon,
  Avatar,
  Button,
  CalendarIcon,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LoadingBlock,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PowerIcon,
  ReceiptIcon,
  StatCard,
  StatusBadge,
  UsersIcon,
  BuildingIcon,
} from '@/components/ui';
import { useConfirm } from '@/hooks/use-confirm';
import { useMutationToast } from '@/hooks/use-mutation-toast';
import { formatDate, formatMoney, formatNumber, formatRelative } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCompany, resetCompanyDetail } from '@/store/slices/company-detail-slice';
import { setCompanyStatus } from '@/store/thunks';
import { CompanyUsersCard } from './company-users-card';

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 text-fg-subtle">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-fg-subtle">{label}</p>
        <div className="text-sm break-words text-fg">{children || '—'}</div>
      </div>
    </div>
  );
}

const BackLink = () => (
  <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
    <ArrowLeftIcon size={15} /> Companies
  </Link>
);

export function CompanyDetailView({ id }: { id: number }) {
  const dispatch = useAppDispatch();
  const { company, loading, error } = useAppSelector((s) => s.companyDetail);
  const { ask, dialog } = useConfirm();
  const toast = useMutationToast();
  const validId = Number.isInteger(id) && id > 0;

  useEffect(() => {
    if (!validId) return;
    dispatch(resetCompanyDetail(id));
    dispatch(fetchCompany(id));
  }, [id, validId, dispatch]);

  if (!validId || (error && !company)) {
    return (
      <>
        <BackLink />
        <Card className="mt-6">
          <EmptyState
            icon={<BuildingIcon />}
            title="Company not found"
            description={validId ? error : 'This link is not valid.'}
            action={validId && <Button variant="secondary" onClick={() => dispatch(fetchCompany(id))}>Try again</Button>}
          />
        </Card>
      </>
    );
  }

  if (!company || company.id !== id) {
    return <LoadingBlock label="Loading company…" />;
  }

  const s = company.stats;
  const toggleStatus = () => {
    const activating = !company.isActive;
    ask(
      {
        title: activating ? `Activate ${company.name}?` : `Deactivate ${company.name}?`,
        description: activating
          ? 'Its users can sign in to this company again.'
          : 'All of its users lose access to it right away. Nothing is deleted, and you can activate it again later.',
        confirmLabel: activating ? 'Activate company' : 'Deactivate company',
        tone: activating ? 'success' : 'danger',
      },
      async () => toast(await dispatch(setCompanyStatus({ id: company.id, isActive: activating })), 'Company updated'),
    );
  };

  return (
    <>
      <BackLink />

      <div className="mt-4 mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={company.name} src={company.logo} square size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight break-words">{company.name}</h1>
            <StatusBadge active={company.isActive} />
          </div>
          <p className="mt-0.5 text-sm text-fg-muted">
            Company #{company.id} · on Numora since {formatDate(company.createdAt)}
          </p>
        </div>
        <Button
          variant={company.isActive ? 'danger' : 'success'}
          icon={<PowerIcon size={15} />}
          onClick={toggleStatus}
          className="w-full sm:w-auto"
        >
          {company.isActive ? 'Deactivate company' : 'Activate company'}
        </Button>
      </div>

      {!company.isActive && (
        <Alert tone="warning" className="mb-6" title="This company is inactive">
          None of its users can open it until it is activated again.
        </Alert>
      )}
      {loading && <p className="sr-only">Refreshing…</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Users"
          icon={<UsersIcon size={18} />}
          value={formatNumber(s.totalUsers)}
          hint={`${formatNumber(s.activeUsers)} active${s.blockedUsers ? ` · ${formatNumber(s.blockedUsers)} blocked` : ''}`}
        />
        <StatCard label="Customers" tone="success" icon={<UsersIcon size={18} />} value={formatNumber(s.customers)} hint={`${formatNumber(s.products)} products & services`} />
        <StatCard
          label="Invoices"
          tone="warning"
          icon={<ReceiptIcon size={18} />}
          value={formatNumber(s.invoices)}
          hint={`Last one ${formatRelative(s.lastInvoiceAt).toLowerCase()}`}
        />
        <StatCard
          label="Billed"
          tone="neutral"
          icon={<ReceiptIcon size={18} />}
          value={formatMoney(s.billedTotal)}
          hint={`${formatMoney(s.collectedTotal)} collected`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
        <Card className="self-start">
          <CardHeader title="Details" />
          <CardBody className="divide-y divide-line py-1">
            <InfoRow icon={<MailIcon size={16} />} label="Email">{company.email}</InfoRow>
            <InfoRow icon={<PhoneIcon size={16} />} label="Phone">{company.phone}</InfoRow>
            <InfoRow icon={<MapPinIcon size={16} />} label="Address">
              {[company.address, company.place].filter(Boolean).join(', ')}
            </InfoRow>
            <InfoRow icon={<CalendarIcon size={16} />} label="Last updated">{formatDate(company.updatedAt)}</InfoRow>
          </CardBody>
        </Card>
        <CompanyUsersCard companyId={company.id} companyName={company.name} />
      </div>
      {dialog}
    </>
  );
}
