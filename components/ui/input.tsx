'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { EyeIcon, EyeOffIcon } from './icons';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightSlot, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-fg">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && <span className="pointer-events-none absolute left-3 text-fg-subtle">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'h-10 w-full rounded-lg border bg-surface px-3 text-sm text-fg shadow-card transition-colors',
            'placeholder:text-fg-subtle focus:outline-none focus:ring-4',
            error
              ? 'border-danger-600 focus:ring-danger-100'
              : 'border-line-strong focus:border-brand-400 focus:ring-brand-100',
            leftIcon && 'pl-9',
            rightSlot && 'pr-10',
          )}
          {...props}
        />
        {rightSlot && <span className="absolute right-1.5">{rightSlot}</span>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'rightSlot'>>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        rightSlot={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="rounded-md p-1.5 text-fg-subtle hover:bg-subtle hover:text-fg"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        }
        {...props}
      />
    );
  },
);
