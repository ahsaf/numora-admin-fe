import { getFileUrl } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

const palette = [
  'bg-brand-100 text-brand-700',
  'bg-success-50 text-success-700',
  'bg-warning-50 text-warning-700',
  'bg-info-50 text-info-700',
  'bg-danger-50 text-danger-700',
];

export function Avatar({
  name,
  src,
  size = 36,
  square,
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  square?: boolean;
  className?: string;
}) {
  const url = getFileUrl(src);
  const tone = palette[(name ?? '').length % palette.length];
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold',
        square ? 'rounded-lg' : 'rounded-full',
        !url && tone,
        className,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by the API host, not optimisable here
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
