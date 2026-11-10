'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChangePasswordModal } from '@/features/auth/change-password-modal';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/auth-slice';
import { setSidebarOpen } from '@/store/slices/ui-slice';
import { Avatar } from '../ui/avatar';
import { KeyIcon, LogOutIcon, MenuIcon } from '../ui/icons';

export function Topbar() {
  const profile = useAppSelector((s) => s.auth.profile);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const signOut = async () => {
    setMenuOpen(false);
    await dispatch(logout());
    router.replace('/login');
  };

  const displayName = profile?.name || profile?.username || 'Admin';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={() => dispatch(setSidebarOpen(true))}
        aria-label="Open menu"
        className="rounded-md p-2 text-fg-muted hover:bg-subtle lg:hidden"
      >
        <MenuIcon size={20} />
      </button>
      <div className="flex-1" />
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 hover:bg-subtle"
        >
          <Avatar name={displayName} src={profile?.avatar} size={32} />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-medium text-fg">{displayName}</span>
            <span className="block text-xs text-fg-subtle">{profile?.email}</span>
          </span>
        </button>
        {menuOpen && (
          <div role="menu" className="absolute right-0 mt-2 w-56 animate-pop-in rounded-lg border border-line bg-surface p-1 shadow-pop">
            <div className="border-b border-line px-3 py-2 sm:hidden">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-fg-subtle">{profile?.email}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setPasswordOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-fg hover:bg-subtle"
            >
              <KeyIcon size={16} className="text-fg-muted" /> Change password
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
            >
              <LogOutIcon size={16} /> Sign out
            </button>
          </div>
        )}
      </div>
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </header>
  );
}
