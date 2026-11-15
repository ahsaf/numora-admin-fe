'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import {
  Alert,
  ArrowDownIcon,
  ArrowUpIcon,
  Badge,
  Button,
  Input,
  Modal,
  PlusIcon,
  Segmented,
  Select,
  TrashIcon,
} from '@/components/ui';
import { companyTypesApi } from '@/lib/api/admin-api';
import { getErrorMessage } from '@/lib/api/client';
import type {
  CompanyType,
  CompanyTypeInput,
  CompanyTypeOptions,
  FormFieldSettingInput,
  TemplateCategory,
  TemplateModule,
  TemplateRole,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';

type Tab = 'general' | 'modules' | 'fields' | 'categories' | 'roles';

type Form = {
  name: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
  modules: TemplateModule[];
  /** Every field of every form, by form key. */
  fields: Record<string, FormFieldSettingInput[]>;
  categories: TemplateCategory[];
  roles: TemplateRole[];
};

const DEFAULT_COLOR = '#2563EB';
const isCount = (v: string) => /^\d+$/.test(v.trim());

const toForm = (type: CompanyType | null, options: CompanyTypeOptions, nextSortOrder: number): Form => {
  const saved = new Map((type?.modules ?? []).map((m) => [m.module, m]));
  const ordered = type?.modules.length
    ? [
        ...type.modules.filter((m) => options.modules.some((o) => o.key === m.module)),
        ...options.modules.filter((o) => !saved.has(o.key)).map((o) => ({ module: o.key, isActive: true })),
      ]
    : options.modules.map((o) => ({ module: o.key, isActive: true }));
  return {
    name: type?.name ?? '',
    description: type?.description ?? '',
    sortOrder: String(type?.sortOrder ?? nextSortOrder),
    isActive: type?.isActive ?? true,
    modules: ordered,
    fields: Object.fromEntries(
      options.forms.map((form) => [
        form.key,
        form.fields.map((def) => {
          const o = type?.formFields[form.key]?.[def.key] ?? {};
          return {
            key: def.key,
            label: o.label ?? def.label,
            isRequired: def.locked || (o.isRequired ?? def.required),
            isActive: def.locked || (o.isActive ?? true),
          };
        }),
      ]),
    ),
    categories: type?.categories.map((c) => ({ ...c })) ?? [],
    roles: type?.roles.map((r) => ({ ...r, permissionKeys: [...r.permissionKeys] })) ?? [],
  };
};

/** Creates a company type, or edits `type`. */
export function CompanyTypeFormModal({
  open,
  type,
  options,
  nextSortOrder,
  onClose,
  onSaved,
}: {
  open: boolean;
  type: CompanyType | null;
  options: CompanyTypeOptions;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<Form>(() => toForm(type, options, nextSortOrder));
  const [tab, setTab] = useState<Tab>('general');
  const [fieldForm, setFieldForm] = useState(options.forms[0]?.key ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Enter a name';
    if (!isCount(form.sortOrder)) next.sortOrder = 'Whole number';
    for (const [formKey, rows] of Object.entries(form.fields)) {
      if (rows.some((r) => !r.label.trim())) next.fields = `Every ${formKey} field needs a label`;
    }
    const names = (rows: { name: string }[]) => rows.map((r) => r.name.trim().toLowerCase());
    const cats = names(form.categories);
    if (cats.some((n) => !n)) next.categories = 'Every category needs a name';
    else if (new Set(cats).size !== cats.length) next.categories = 'Category names must be different';
    const roles = names(form.roles);
    if (roles.some((n) => !n)) next.roles = 'Every role needs a name';
    else if (form.roles.some((r) => !/^\s*[A-Za-z0-9][A-Za-z0-9 ]*$/.test(r.name)))
      next.roles = 'Role names can have only letters, numbers and spaces';
    else if (new Set(roles).size !== roles.length) next.roles = 'Role names must be different';
    return next;
  };

  /** The tab that shows an error, so it can be opened. */
  const tabOf = (key: string): Tab =>
    key === 'fields' ? 'fields' : key === 'categories' ? 'categories' : key === 'roles' ? 'roles' : 'general';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    const firstError = Object.keys(next).find((k) => next[k]);
    if (firstError) {
      setTab(tabOf(firstError));
      return;
    }
    const body: CompanyTypeInput = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      modules: form.modules,
      formFields: Object.entries(form.fields).map(([formKey, fields]) => ({
        form: formKey,
        fields: fields.map((f) => ({ ...f, label: f.label.trim() })),
      })),
      categories: form.categories.map((c) => ({ ...c, name: c.name.trim() })),
      roles: form.roles.map((r) => ({ ...r, name: r.name.trim() })),
    };
    setSaving(true);
    setServerError(null);
    try {
      const res = type ? await companyTypesApi.update(type.id, body) : await companyTypesApi.create(body);
      onSaved(res.message || 'Company type saved');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'general', label: 'General' },
    { value: 'modules', label: 'Modules' },
    { value: 'fields', label: 'Form fields' },
    { value: 'categories', label: 'Categories', count: form.categories.length },
    { value: 'roles', label: 'Roles', count: form.roles.length },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      size="xl"
      title={type ? `Edit ${type.name}` : 'New company type'}
      description={
        type?.companies
          ? 'Changes apply to companies set up from now on. Companies already of this type keep their setup.'
          : 'What a new company of this kind starts with. The company can still change all of it.'
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        {serverError && <Alert>{serverError}</Alert>}

        <div className="overflow-x-auto">
          <Segmented ariaLabel="Section" value={tab} onChange={setTab} options={tabs} />
        </div>

        {tab === 'general' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                error={errors.name}
                maxLength={60}
                placeholder="e.g. Subscription service"
                hint="Shown to the user when they set up their organisation."
                autoFocus
              />
              <Input
                label="Position"
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', e.target.value)}
                error={errors.sortOrder}
                hint="Lower comes first"
              />
            </div>
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={300}
              placeholder="Optional, for your own reference"
            />
            <label className="flex items-start gap-3 rounded-lg border border-line p-3">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-brand-600"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
              />
              <span className="text-sm">
                <span className="font-medium text-fg">Offer at setup</span>
                <span className="block text-fg-muted">When off, new companies can&apos;t pick this type.</span>
              </span>
            </label>
          </div>
        )}

        {tab === 'modules' && (
          <ModulesEditor options={options} modules={form.modules} onChange={(m) => set('modules', m)} />
        )}

        {tab === 'fields' && (
          <Section
            title="Form fields"
            description="Labels and rules of the create and edit forms. Fields left as they are keep the defaults."
          >
            <Segmented
              ariaLabel="Form"
              value={fieldForm}
              onChange={setFieldForm}
              options={options.forms.map((f) => ({ value: f.key, label: f.label }))}
            />
            <FieldsEditor
              defs={options.forms.find((f) => f.key === fieldForm)?.fields ?? []}
              rows={form.fields[fieldForm] ?? []}
              onChange={(rows) => set('fields', { ...form.fields, [fieldForm]: rows })}
            />
            {errors.fields && <p className="text-xs text-danger-600">{errors.fields}</p>}
          </Section>
        )}

        {tab === 'categories' && (
          <CategoriesEditor
            options={options}
            categories={form.categories}
            error={errors.categories}
            onChange={(c) => set('categories', c)}
          />
        )}

        {tab === 'roles' && (
          <RolesEditor options={options} roles={form.roles} error={errors.roles} onChange={(r) => set('roles', r)} />
        )}

        <div className="-mx-6 flex justify-end gap-2 border-t border-line bg-subtle/50 px-6 py-3.5">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {type ? 'Save company type' : 'Create company type'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------- modules

function ModulesEditor({
  options,
  modules,
  onChange,
}: {
  options: CompanyTypeOptions;
  modules: TemplateModule[];
  onChange: (modules: TemplateModule[]) => void;
}) {
  const meta = (key: string) => options.modules.find((m) => m.key === key);
  const move = (index: number, by: -1 | 1) => {
    const next = [...modules];
    const [row] = next.splice(index, 1);
    next.splice(index + by, 0, row);
    onChange(next);
  };
  return (
    <Section
      title="Modules"
      description="Which modules the company uses, in sidebar order. A module also has to be in the company's plan to show."
    >
      <ul className="divide-y divide-line rounded-lg border border-line">
        {modules.map((row, index) => {
          const m = meta(row.module);
          return (
            <li key={row.module} className="flex items-center gap-3 px-3 py-2">
              <div className="flex flex-col">
                <IconButton small label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUpIcon size={14} />
                </IconButton>
                <IconButton small label="Move down" disabled={index === modules.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDownIcon size={14} />
                </IconButton>
              </div>
              <span className={cn('flex-1 text-sm font-medium', !row.isActive && 'text-fg-subtle line-through')}>
                {m?.label ?? row.module}
              </span>
              {m?.isLocked ? (
                <Badge>Always on</Badge>
              ) : (
                <Toggle
                  label={`${m?.label ?? row.module} on`}
                  checked={row.isActive}
                  onChange={(isActive) =>
                    onChange(modules.map((r, i) => (i === index ? { ...r, isActive } : r)))
                  }
                />
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

// ----------------------------------------------------------------- fields

function FieldsEditor({
  defs,
  rows,
  onChange,
}: {
  defs: CompanyTypeOptions['forms'][number]['fields'];
  rows: FormFieldSettingInput[];
  onChange: (rows: FormFieldSettingInput[]) => void;
}) {
  const update = (key: string, patch: Partial<FormFieldSettingInput>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-sm">
        <thead className="bg-subtle text-left text-xs text-fg-subtle">
          <tr>
            <th className="px-3 py-2 font-medium">Field</th>
            <th className="px-3 py-2 font-medium">Label</th>
            <th className="px-3 py-2 text-center font-medium">Shown</th>
            <th className="px-3 py-2 text-center font-medium">Required</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {defs.map((def) => {
            const row = rows.find((r) => r.key === def.key);
            if (!row) return null;
            const canRequire = !def.locked && !def.noRequired && def.kind !== 'switch';
            return (
              <tr key={def.key}>
                <td className="px-3 py-2 whitespace-nowrap text-fg-muted">{def.label}</td>
                <td className="px-3 py-1.5">
                  <input
                    aria-label={`${def.label} label`}
                    value={row.label}
                    maxLength={50}
                    onChange={(e) => update(def.key, { label: e.target.value })}
                    className="h-8 w-full min-w-36 rounded-md border border-line-strong bg-surface px-2 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    aria-label={`${def.label} shown`}
                    className="size-4 accent-brand-600"
                    checked={row.isActive}
                    disabled={def.locked}
                    onChange={(e) =>
                      update(def.key, {
                        isActive: e.target.checked,
                        ...(!e.target.checked && { isRequired: false }),
                      })
                    }
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    aria-label={`${def.label} required`}
                    className="size-4 accent-brand-600"
                    checked={row.isRequired}
                    disabled={!canRequire || !row.isActive}
                    onChange={(e) => update(def.key, { isRequired: e.target.checked })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------- categories

function CategoriesEditor({
  options,
  categories,
  error,
  onChange,
}: {
  options: CompanyTypeOptions;
  categories: TemplateCategory[];
  error?: string;
  onChange: (categories: TemplateCategory[]) => void;
}) {
  const update = (index: number, patch: Partial<TemplateCategory>) =>
    onChange(categories.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  return (
    <Section title="Categories" description="Labels the company starts with, e.g. plan tiers or expense heads.">
      {categories.length === 0 && <p className="text-sm text-fg-muted">No categories yet.</p>}
      {categories.map((c, index) => (
        <div key={index} className="flex items-end gap-2">
          <input
            type="color"
            aria-label="Colour"
            value={c.color}
            onChange={(e) => update(index, { color: e.target.value.toUpperCase() })}
            className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-surface p-1"
          />
          <Input
            className="flex-1"
            label={index === 0 ? 'Name' : undefined}
            aria-label="Category name"
            value={c.name}
            maxLength={50}
            onChange={(e) => update(index, { name: e.target.value })}
          />
          <Select
            className="w-40"
            label={index === 0 ? 'Used for' : undefined}
            aria-label="Used for"
            value={String(c.type)}
            onChange={(e) => update(index, { type: Number(e.target.value) })}
          >
            {options.categoryTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          <IconButton label="Remove category" onClick={() => onChange(categories.filter((_, i) => i !== index))}>
            <TrashIcon size={16} />
          </IconButton>
        </div>
      ))}
      {error && <p className="text-xs text-danger-600">{error}</p>}
      <div>
        <Button
          variant="secondary"
          size="sm"
          icon={<PlusIcon size={14} />}
          disabled={categories.length >= 50}
          onClick={() =>
            onChange([...categories, { name: '', color: DEFAULT_COLOR, type: options.categoryTypes[0]?.value ?? 0 }])
          }
        >
          Add category
        </Button>
      </div>
    </Section>
  );
}

// ------------------------------------------------------------------ roles

function RolesEditor({
  options,
  roles,
  error,
  onChange,
}: {
  options: CompanyTypeOptions;
  roles: TemplateRole[];
  error?: string;
  onChange: (roles: TemplateRole[]) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(roles.length ? 0 : null);
  const update = (index: number, patch: Partial<TemplateRole>) =>
    onChange(roles.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const toggleKey = (index: number, key: string) => {
    const keys = roles[index].permissionKeys;
    update(index, { permissionKeys: keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key] });
  };

  return (
    <Section
      title="Roles"
      description="Roles the company starts with, for the users it invites. The company admin always has every permission."
    >
      {roles.length === 0 && <p className="text-sm text-fg-muted">No roles yet.</p>}
      {roles.map((role, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="rounded-lg border border-line">
            <div className="flex items-end gap-2 p-3">
              <Input
                className="flex-1"
                label="Role name"
                value={role.name}
                maxLength={100}
                onChange={(e) => update(index, { name: e.target.value.replace(/[^A-Za-z0-9 ]/g, '') })}
              />
              <Button variant="secondary" onClick={() => setOpenIndex(isOpen ? null : index)}>
                {isOpen ? 'Hide permissions' : `Permissions (${role.permissionKeys.length})`}
              </Button>
              <IconButton
                label="Remove role"
                onClick={() => {
                  onChange(roles.filter((_, i) => i !== index));
                  setOpenIndex(null);
                }}
              >
                <TrashIcon size={16} />
              </IconButton>
            </div>
            {isOpen && (
              <div className="overflow-x-auto border-t border-line">
                <table className="w-full text-sm">
                  <thead className="bg-subtle text-xs text-fg-subtle">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Module</th>
                      {options.permissionActions.map((a) => (
                        <th key={a.key} className="px-3 py-2 text-center font-medium">
                          {a.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {options.permissionModules.map((m) => (
                      <tr key={m.key}>
                        <td className="px-3 py-1.5 text-fg-muted">{m.label}</td>
                        {options.permissionActions.map((a) => {
                          const key = `${m.key}:${a.key}`;
                          return (
                            <td key={a.key} className="px-3 py-1.5 text-center">
                              <input
                                type="checkbox"
                                aria-label={`${m.label} ${a.label}`}
                                className="size-4 accent-brand-600"
                                checked={role.permissionKeys.includes(key)}
                                onChange={() => toggleKey(index, key)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
      {error && <p className="text-xs text-danger-600">{error}</p>}
      <div>
        <Button
          variant="secondary"
          size="sm"
          icon={<PlusIcon size={14} />}
          disabled={roles.length >= 20}
          onClick={() => {
            onChange([...roles, { name: '', permissionKeys: [] }]);
            setOpenIndex(roles.length);
          }}
        >
          Add role
        </Button>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- helpers

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <div>
        <legend className="text-sm font-semibold text-fg">{title}</legend>
        {description && <p className="text-xs text-fg-subtle">{description}</p>}
      </div>
      {children}
    </fieldset>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  small,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Half height, for the stacked up / down arrows. */
  small?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex min-w-8 items-center justify-center rounded-md px-1 text-fg-subtle hover:bg-subtle hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent',
        small ? 'h-5' : 'h-10',
      )}
    >
      {children}
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-brand-600' : 'bg-line-strong',
      )}
    >
      <span
        className={cn(
          'inline-block size-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4.5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
