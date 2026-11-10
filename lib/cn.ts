type ClassValue = string | number | bigint | boolean | null | undefined;

/** Joins class names, skipping falsy ones (so `cond && 'class'` works with any condition). */
export const cn = (...classes: ClassValue[]) => classes.filter((c) => typeof c === 'string' && c).join(' ');
