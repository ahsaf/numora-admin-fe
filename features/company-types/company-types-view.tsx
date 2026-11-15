'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  LoadingBlock,
  PageHeader,
  ShapesIcon,
  StatusBadge,
} from '@/components/ui';
import { useConfirm } from '@/hooks/use-confirm';
import { companyTypesApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import type { CompanyType, CompanyTypeOptions } from '@/lib/api/types';
import { formatNumber } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { notify } from '@/store/slices/ui-slice';
import { CompanyTypeFormModal } from './company-type-form-modal';

export function CompanyTypesView() {
  const dispatch = useAppDispatch();
  const [types, setTypes] = useState<CompanyType[] | null>(null);
  const [options, setOptions] = useState<CompanyTypeOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** undefined = closed, null = new type */
  const [editing, setEditing] = useState<CompanyType | null | undefined>(undefined);
  const { ask, dialog } = useConfirm();

  const load = useCallback(
    () =>
      Promise.all([companyTypesApi.list(), companyTypesApi.options()]).then(
        ([list, opts]) => {
          setError(null);
          setTypes(list.data);
          setOptions(opts.data);
        },
        (e) => setError(getErrorMessage(e)),
      ),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const remove = (type: CompanyType) =>
    ask(
      {
        title: `Delete ${type.name}?`,
        description: type.companies
          ? `${type.companies} compan${type.companies === 1 ? 'y was' : 'ies were'} set up as this type. They keep their setup, but it can't be picked for new companies.`
          : "It can't be picked when a new company is set up.",
        confirmLabel: 'Delete type',
        tone: 'danger',
      },
      async () => {
        try {
          const res = await companyTypesApi.remove(type.id);
          dispatch(notify('success', res.message || 'Company type deleted'));
          await load();
        } catch (e) {
          dispatch(notify('error', getErrorMessage(e)));
        }
      },
    );

  const moduleLabel = (key: string) => options?.modules.find((m) => m.key === key)?.label ?? key;
  const canAdd = !!options;

  return (
    <>
      <PageHeader
        title="Company types"
        description="Kinds of business a company can pick at setup. A new company starts with its type's modules, form fields, categories and roles, and can change them later."
        actions={
          <Button onClick={() => setEditing(null)} disabled={!canAdd}>
            New company type
          </Button>
        }
      />

      {error && (
        <Alert className="mb-6" title="Could not load company types">
          {error}{' '}
          <button className="font-medium underline" onClick={load}>
            Try again
          </button>
        </Alert>
      )}

      {!types && !error && <LoadingBlock label="Loading company types…" />}

      {types && types.length === 0 && (
        <Card>
          <EmptyState
            icon={<ShapesIcon />}
            title="No company types yet"
            description='Until you add one, new companies only see "Other" and start with the default setup.'
            action={
              <Button onClick={() => setEditing(null)} disabled={!canAdd}>
                New company type
              </Button>
            }
          />
        </Card>
      )}

      {types && types.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {types.map((type) => {
            const off = type.modules.filter((m) => !m.isActive);
            const changedFields = Object.values(type.formFields).reduce((n, f) => n + Object.keys(f).length, 0);
            return (
              <Card key={type.id} className="flex flex-col">
                <CardBody className="flex flex-1 flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold break-words">{type.name}</h2>
                        <StatusBadge active={type.isActive} activeLabel="Offered" inactiveLabel="Hidden" />
                      </div>
                      {type.description && <p className="mt-0.5 text-sm text-fg-muted">{type.description}</p>}
                    </div>
                    <span className="tabular shrink-0 text-xs text-fg-subtle">
                      {formatNumber(type.companies ?? 0)} compan{type.companies === 1 ? 'y' : 'ies'}
                    </span>
                  </div>

                  <Summary title="Modules turned off">
                    {off.length ? (
                      off.map((m) => <Badge key={m.module}>{moduleLabel(m.module)}</Badge>)
                    ) : (
                      <span className="text-sm text-fg-muted">None, every module is on</span>
                    )}
                  </Summary>

                  <Summary title="Categories">
                    {type.categories.length ? (
                      type.categories.map((c) => (
                        <Badge key={c.name}>
                          <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-fg-muted">None</span>
                    )}
                  </Summary>

                  <Summary title="Roles">
                    {type.roles.length ? (
                      type.roles.map((r) => <Badge key={r.name}>{r.name}</Badge>)
                    ) : (
                      <span className="text-sm text-fg-muted">None</span>
                    )}
                  </Summary>

                  <p className="text-sm text-fg-muted">
                    {changedFields
                      ? `${changedFields} form field${changedFields === 1 ? '' : 's'} changed from the defaults`
                      : 'Default form fields'}
                  </p>

                  <div className="mt-auto flex gap-2 border-t border-line pt-4">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(type)} disabled={!canAdd}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(type)}
                      className="text-danger-600 hover:text-danger-700"
                    >
                      Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {editing !== undefined && options && (
        <CompanyTypeFormModal
          key={editing?.id ?? 'new'}
          open
          type={editing}
          options={options}
          nextSortOrder={types?.length ?? 0}
          onClose={() => setEditing(undefined)}
          onSaved={(message) => {
            dispatch(notify('success', message));
            setEditing(undefined);
            load();
          }}
        />
      )}
      {dialog}
    </>
  );
}

function Summary({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium tracking-wide text-fg-subtle uppercase">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
