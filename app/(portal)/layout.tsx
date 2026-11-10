import { AppShell } from '@/components/layout/app-shell';

/** Every signed-in page: sidebar + top bar, behind the session check. */
export default function PortalLayout({ children }: LayoutProps<'/'>) {
  return <AppShell>{children}</AppShell>;
}
