import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** Stroke icons (24px grid, Lucide-style) so the portal needs no icon package. */
function make(paths: React.ReactNode, displayName: string) {
  function Icon({ size = 18, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {paths}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const GaugeIcon = make(<><path d="M12 14l4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></>, 'GaugeIcon');
export const BuildingIcon = make(<><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" /></>, 'BuildingIcon');
export const UserBlockIcon = make(<><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6" /><circle cx="18" cy="17" r="4" /><path d="M15.2 19.8l5.6-5.6" /></>, 'UserBlockIcon');
export const UsersIcon = make(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>, 'UsersIcon');
export const CreditCardIcon = make(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>, 'CreditCardIcon');
export const LayersIcon = make(<><path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="m2 17 10 5 10-5M2 12l10 5 10-5" /></>, 'LayersIcon');
export const SearchIcon = make(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>, 'SearchIcon');
export const ChevronLeftIcon = make(<path d="m15 18-6-6 6-6" />, 'ChevronLeftIcon');
export const ChevronRightIcon = make(<path d="m9 18 6-6-6-6" />, 'ChevronRightIcon');
export const ArrowLeftIcon = make(<><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>, 'ArrowLeftIcon');
export const LogOutIcon = make(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>, 'LogOutIcon');
export const KeyIcon = make(<><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" /></>, 'KeyIcon');
export const MenuIcon = make(<path d="M4 6h16M4 12h16M4 18h16" />, 'MenuIcon');
export const XIcon = make(<path d="M18 6 6 18M6 6l12 12" />, 'XIcon');
export const CheckIcon = make(<path d="M20 6 9 17l-5-5" />, 'CheckIcon');
export const AlertIcon = make(<><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>, 'AlertIcon');
export const InfoIcon = make(<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>, 'InfoIcon');
export const RefreshIcon = make(<><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5M3 21v-5h5" /></>, 'RefreshIcon');
export const ReceiptIcon = make(<><path d="M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2Z" /><path d="M8 8h8M8 12h8M8 16h5" /></>, 'ReceiptIcon');
export const TrendingUpIcon = make(<><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></>, 'TrendingUpIcon');
export const MailIcon = make(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>, 'MailIcon');
export const PhoneIcon = make(<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />, 'PhoneIcon');
export const MapPinIcon = make(<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>, 'MapPinIcon');
export const CalendarIcon = make(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>, 'CalendarIcon');
export const PowerIcon = make(<><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.8 0" /></>, 'PowerIcon');
export const BanIcon = make(<><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></>, 'BanIcon');
export const UnlockIcon = make(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></>, 'UnlockIcon');
export const EyeIcon = make(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>, 'EyeIcon');
export const EyeOffIcon = make(<><path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><path d="m2 2 20 20M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>, 'EyeOffIcon');
export const SparkIcon = make(<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />, 'SparkIcon');
