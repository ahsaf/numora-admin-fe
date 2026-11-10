'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_SECTIONS } from '@/config/navigation';
import { cn } from '@/lib/cn';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSidebarOpen } from '@/store/slices/ui-slice';
import { XIcon } from '../ui/icons';
import { Brand } from './brand';

export function Sidebar() {
  const pathname = usePathname();
  const open = useAppSelector((s) => s.ui.sidebarOpen);
  const dispatch = useAppDispatch();
  const close = () => dispatch(setSidebarOpen(false));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 animate-fade-in bg-fg/40 lg:hidden" onClick={close} aria-hidden="true" />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-nav transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Brand inverted />
          <button type="button" onClick={close} aria-label="Close menu" className="rounded-md p-1.5 text-nav-fg hover:bg-nav-hover lg:hidden">
            <XIcon size={18} />
          </button>
        </div>
        <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section, i) => (
            <div key={section.title ?? i}>
              {section.title && (
                <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-nav-fg/60 uppercase">{section.title}</p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const base = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors';
                  if (item.comingSoon) {
                    return (
                      <li key={item.href}>
                        <span className={cn(base, 'cursor-not-allowed text-nav-fg/45')} aria-disabled="true">
                          {item.icon}
                          <span className="flex-1">{item.label}</span>
                          <span className="rounded bg-nav-hover px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-nav-fg/70 uppercase">
                            Soon
                          </span>
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          base,
                          active ? 'bg-brand-500/15 text-white' : 'text-nav-fg hover:bg-nav-hover hover:text-white',
                        )}
                      >
                        <span className={cn(active && 'text-brand-300')}>{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <p className="px-6 py-4 text-xs text-nav-fg/50">Super admin access</p>
      </aside>
    </>
  );
}
