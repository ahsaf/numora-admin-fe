'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  BuildingIcon,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  Pagination,
  PowerIcon,
  SearchInput,
  Segmented,
  StatusBadge,
  type Column,
} from '@/components/ui';
import { useConfirm } from '@/hooks/use-confirm';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useMutationToast } from '@/hooks/use-mutation-toast';
import type { CompanyListItem, CompanyStatusFilter } from '@/lib/api/types';
import { formatDate, formatNumber } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCompanies, setCompaniesQuery } from '@/store/slices/companies-slice';
import { setCompanyStatus } from '@/store/thunks';

export function CompaniesView() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { query, items, totalCount, summary, loading, error } = useAppSelector((s) => s.companies);
  const [search, setSearch] = useState(query.search);
  const debouncedSearch = useDebouncedValue(search);
  const { ask, dialog } = useConfirm();
  const toast = useMutationToast();

  useEffect(() => {
    if (debouncedSearch !== query.search) dispatch(setCompaniesQuery({ search: debouncedSearch }));
  }, [debouncedSearch, query.search, dispatch]);

  useEffect(() => {
    dispatch(fetchCompanies(query));
  }, [query, dispatch]);

  const toggleStatus = (company: CompanyListItem) => {
    const activating = !company.isActive;
    ask(
      {
        title: activating ? `Activate ${company.name}?` : `Deactivate ${company.name}?`,
        description: activating
          ? 'Its users can sign in to this company again.'
          : 'Its users lose access to this company right away. Nothing is deleted, and you can activate it again later.',
        confirmLabel: activating ? 'Activate' : 'Deactivate',
        tone: activating ? 'success' : 'danger',
      },
      async () => toast(await dispatch(setCompanyStatus({ id: company.id, isActive: activating })), 'Company updated'),
    );
  };

  const columns: Column<CompanyListItem>[] = [
    {
      key: 'company',
      header: 'Company',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} src={c.logo} square size={36} />
          <div className="min-w-0">
            <p className="truncate font-medium">{c.name}</p>
            <p className="truncate text-xs text-fg-subtle">{c.email ?? c.phone ?? c.place ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      className: 'hidden md:table-cell',
      cell: (c) =>
        c.ownerEmail ? (
          <div className="min-w-0">
            <p className="truncate">{c.ownerName ?? '—'}</p>
            <p className="truncate text-xs text-fg-subtle">{c.ownerEmail}</p>
          </div>
        ) : (
          <span className="text-fg-subtle">No admin</span>
        ),
    },
    { key: 'users', header: 'Users', className: 'text-right', cell: (c) => <span className="tabular">{formatNumber(c.userCount)}</span> },
    {
      key: 'invoices',
      header: 'Invoices',
      className: 'hidden text-right sm:table-cell',
      cell: (c) => <span className="tabular">{formatNumber(c.invoiceCount)}</span>,
    },
    { key: 'joined', nowrap: true, header: 'Joined', className: 'hidden lg:table-cell', cell: (c) => <span className="text-fg-muted">{formatDate(c.createdAt)}</span> },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge active={c.isActive} /> },
    {
      key: 'actions', nowrap: true,
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (c) => (
        <Button
          size="sm"
          variant={c.isActive ? 'secondary' : 'success'}
          icon={<PowerIcon size={13} />}
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(c);
          }}
        >
          {c.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Companies" description="Every organisation on Numora. Open one to manage its users." />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <Segmented<CompanyStatusFilter>
            ariaLabel="Filter by status"
            value={query.status}
            onChange={(status) => dispatch(setCompaniesQuery({ status }))}
            options={[
              { value: 'all', label: 'All', count: summary.all },
              { value: 'active', label: 'Active', count: summary.active },
              { value: 'inactive', label: 'Inactive', count: summary.inactive },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, phone, place" />
        </div>

        {error && (
          <Alert className="m-5" action={<Button size="sm" variant="secondary" onClick={() => dispatch(fetchCompanies(query))}>Retry</Button>}>
            {error}
          </Alert>
        )}

        <DataTable
          columns={columns}
          rows={items}
          rowKey={(c) => c.id}
          loading={loading}
          onRowClick={(c) => router.push(`/companies/${c.id}`)}
          empty={
            <EmptyState
              icon={<BuildingIcon />}
              title={query.search || query.status !== 'all' ? 'No companies match' : 'No companies yet'}
              description={query.search || query.status !== 'all' ? 'Try another search or status.' : 'Companies appear here when owners sign up.'}
            />
          }
          footer={
            totalCount > 0 && (
              <Pagination
                page={query.page}
                limit={query.limit}
                totalCount={totalCount}
                onPageChange={(page) => dispatch(setCompaniesQuery({ page }))}
                onLimitChange={(limit) => dispatch(setCompaniesQuery({ limit }))}
              />
            )
          }
        />
      </Card>
      {dialog}
    </>
  );
}
