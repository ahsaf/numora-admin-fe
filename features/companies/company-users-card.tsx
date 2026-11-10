'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  BanIcon,
  Button,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  Pagination,
  PowerIcon,
  SearchInput,
  UnlockIcon,
  UsersIcon,
  type Column,
} from '@/components/ui';
import { useConfirm } from '@/hooks/use-confirm';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useMutationToast } from '@/hooks/use-mutation-toast';
import type { CompanyUser } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCompanyUsers, setCompanyUsersQuery } from '@/store/slices/company-detail-slice';
import { setCompanyUserStatus, setUserBlocked } from '@/store/thunks';

export function CompanyUsersCard({ companyId, companyName }: { companyId: number; companyName: string }) {
  const dispatch = useAppDispatch();
  const { query, items, totalCount, loading, error } = useAppSelector((s) => s.companyDetail.users);
  const [search, setSearch] = useState(query.search);
  const debouncedSearch = useDebouncedValue(search);
  const { ask, dialog } = useConfirm();
  const toast = useMutationToast();

  useEffect(() => {
    if (debouncedSearch !== query.search) dispatch(setCompanyUsersQuery({ search: debouncedSearch }));
  }, [debouncedSearch, query.search, dispatch]);

  useEffect(() => {
    dispatch(fetchCompanyUsers({ companyId, query }));
  }, [companyId, query, dispatch]);

  const displayName = (u: CompanyUser) => u.name || u.username || u.email || `User #${u.id}`;

  const toggleMembership = (u: CompanyUser) => {
    const activating = !u.isActive;
    ask(
      {
        title: activating ? `Activate ${displayName(u)} in ${companyName}?` : `Deactivate ${displayName(u)} in ${companyName}?`,
        description: activating
          ? 'They can open this company again.'
          : 'They lose access to this company only. Other companies they belong to are not affected.',
        confirmLabel: activating ? 'Activate' : 'Deactivate',
        tone: activating ? 'success' : 'danger',
      },
      async () => toast(await dispatch(setCompanyUserStatus({ companyId, userId: u.id, isActive: activating })), 'User updated'),
    );
  };

  const toggleBlock = (u: CompanyUser) => {
    const blocking = !u.isBlocked;
    ask(
      {
        title: blocking ? `Block ${displayName(u)}?` : `Unblock ${displayName(u)}?`,
        description: blocking
          ? 'They are signed out everywhere and cannot sign in to any company until unblocked.'
          : 'They can sign in again, to every company they still belong to.',
        confirmLabel: blocking ? 'Block user' : 'Unblock',
        tone: blocking ? 'danger' : 'success',
      },
      async () => toast(await dispatch(setUserBlocked({ id: u.id, blocked: blocking })), blocking ? 'User blocked' : 'User unblocked'),
    );
  };

  const columns: Column<CompanyUser>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={displayName(u)} src={u.avatar} size={34} />
          <div className="min-w-0">
            <p className="truncate font-medium">{displayName(u)}</p>
            <p className="truncate text-xs text-fg-subtle">{u.email ?? u.phone ?? '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      className: 'hidden sm:table-cell',
      cell: (u) => (u.isAdmin ? <Badge tone="brand">Admin</Badge> : <span className="text-fg-muted">{u.roleName ?? 'No role'}</span>),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => (
        <div className="flex flex-wrap gap-1.5">
          {u.isBlocked ? (
            <Badge tone="danger" dot>
              Blocked
            </Badge>
          ) : u.isActive ? (
            <Badge tone="success" dot>
              Active
            </Badge>
          ) : (
            <Badge dot>Inactive here</Badge>
          )}
          {u.isBlocked && !u.isActive && <Badge>Inactive here</Badge>}
          {!u.isEmailVerified && <Badge tone="warning">Unverified</Badge>}
        </div>
      ),
    },
    { key: 'joined', nowrap: true, header: 'Joined', className: 'hidden lg:table-cell', cell: (u) => <span className="text-fg-muted">{formatDate(u.joinedAt)}</span> },
    {
      key: 'actions', nowrap: true,
      header: <span className="sr-only">Actions</span>,
      className: 'text-right',
      cell: (u) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" icon={<PowerIcon size={13} />} onClick={() => toggleMembership(u)}>
            {u.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            size="sm"
            variant={u.isBlocked ? 'success' : 'ghost'}
            className={u.isBlocked ? undefined : 'text-danger-600 hover:bg-danger-50 hover:text-danger-700'}
            icon={u.isBlocked ? <UnlockIcon size={13} /> : <BanIcon size={13} />}
            onClick={() => toggleBlock(u)}
          >
            {u.isBlocked ? 'Unblock' : 'Block'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Users"
        description="Deactivate removes access to this company only. Block stops the person signing in anywhere."
        action={<SearchInput value={search} onChange={setSearch} placeholder="Search users" />}
      />
      {error && (
        <Alert
          className="m-5"
          action={<Button size="sm" variant="secondary" onClick={() => dispatch(fetchCompanyUsers({ companyId, query }))}>Retry</Button>}
        >
          {error}
        </Alert>
      )}
      <DataTable
        columns={columns}
        rows={items}
        rowKey={(u) => u.id}
        loading={loading}
        skeletonRows={4}
        empty={<EmptyState icon={<UsersIcon />} title={query.search ? 'No users match' : 'No users in this company'} />}
        footer={
          totalCount > 0 && (
            <Pagination
              page={query.page}
              limit={query.limit}
              totalCount={totalCount}
              onPageChange={(page) => dispatch(setCompanyUsersQuery({ page }))}
              onLimitChange={(limit) => dispatch(setCompanyUsersQuery({ limit }))}
            />
          )
        }
      />
      {dialog}
    </Card>
  );
}
