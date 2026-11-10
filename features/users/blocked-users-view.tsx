'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  Pagination,
  SearchInput,
  UnlockIcon,
  UserBlockIcon,
  type Column,
} from '@/components/ui';
import { useConfirm } from '@/hooks/use-confirm';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useMutationToast } from '@/hooks/use-mutation-toast';
import type { BlockedUser } from '@/lib/api/types';
import { formatDate, formatNumber } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchBlockedUsers, setBlockedUsersQuery } from '@/store/slices/blocked-users-slice';
import { setUserBlocked } from '@/store/thunks';

const MAX_COMPANIES_SHOWN = 2;

export function BlockedUsersView() {
  const dispatch = useAppDispatch();
  const { query, items, totalCount, loading, error } = useAppSelector((s) => s.blockedUsers);
  const [search, setSearch] = useState(query.search);
  const debouncedSearch = useDebouncedValue(search);
  const { ask, dialog } = useConfirm();
  const toast = useMutationToast();

  useEffect(() => {
    if (debouncedSearch !== query.search) dispatch(setBlockedUsersQuery({ search: debouncedSearch }));
  }, [debouncedSearch, query.search, dispatch]);

  useEffect(() => {
    dispatch(fetchBlockedUsers(query));
  }, [query, dispatch]);

  const displayName = (u: BlockedUser) => u.name || u.username || u.email || `User #${u.id}`;

  const unblock = (u: BlockedUser) =>
    ask(
      {
        title: `Unblock ${displayName(u)}?`,
        description: 'They can sign in again, to every company they still belong to.',
        confirmLabel: 'Unblock',
        tone: 'success',
      },
      async () => {
        toast(await dispatch(setUserBlocked({ id: u.id, blocked: false })), 'User unblocked');
        // Pull the next page's first row into view if this page emptied.
        if (items.length === 1 && query.page > 1) dispatch(setBlockedUsersQuery({ page: query.page - 1 }));
      },
    );

  const columns: Column<BlockedUser>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={displayName(u)} src={u.avatar} size={34} className="grayscale" />
          <div className="min-w-0">
            <p className="truncate font-medium">{displayName(u)}</p>
            <p className="truncate text-xs text-fg-subtle">{u.email ?? u.phone ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'companies',
      header: 'Companies',
      className: 'hidden md:table-cell',
      cell: (u) =>
        u.companies.length ? (
          <span className="text-sm">
            {u.companies.slice(0, MAX_COMPANIES_SHOWN).map((c, i) => (
              <span key={c.id}>
                {i > 0 && ', '}
                <Link href={`/companies/${c.id}`} className="text-brand-600 hover:underline">
                  {c.name}
                </Link>
              </span>
            ))}
            {u.companies.length > MAX_COMPANIES_SHOWN && (
              <span className="text-fg-subtle"> +{u.companies.length - MAX_COMPANIES_SHOWN} more</span>
            )}
          </span>
        ) : (
          <span className="text-fg-subtle">None</span>
        ),
    },
    { key: 'since', nowrap: true, header: 'Member since', className: 'hidden lg:table-cell', cell: (u) => <span className="text-fg-muted">{formatDate(u.createdAt)}</span> },
    { key: 'blocked', nowrap: true, header: 'Blocked', className: 'hidden sm:table-cell', cell: (u) => <span className="text-fg-muted">{formatDate(u.blockedAt)}</span> },
    {
      key: 'actions', nowrap: true,
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (u) => (
        <Button size="sm" variant="secondary" icon={<UnlockIcon size={13} />} onClick={() => unblock(u)}>
          Unblock
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Blocked users"
        description={`People who can't sign in to Numora${totalCount ? ` · ${formatNumber(totalCount)} blocked` : ''}. Block someone from their company's page.`}
      />
      <Card>
        <div className="flex justify-end border-b border-line px-5 py-3.5">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, phone" />
        </div>
        {error && (
          <Alert className="m-5" action={<Button size="sm" variant="secondary" onClick={() => dispatch(fetchBlockedUsers(query))}>Retry</Button>}>
            {error}
          </Alert>
        )}
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(u) => u.id}
          loading={loading}
          empty={
            <EmptyState
              icon={<UserBlockIcon />}
              title={query.search ? 'No blocked users match' : 'No one is blocked'}
              description={query.search ? 'Try another search.' : 'Users you block from a company page show up here.'}
            />
          }
          footer={
            totalCount > 0 && (
              <Pagination
                page={query.page}
                limit={query.limit}
                totalCount={totalCount}
                onPageChange={(page) => dispatch(setBlockedUsersQuery({ page }))}
                onLimitChange={(limit) => dispatch(setBlockedUsersQuery({ limit }))}
              />
            )
          }
        />
      </Card>
      {dialog}
    </>
  );
}
