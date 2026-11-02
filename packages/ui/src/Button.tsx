import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--primary-bg)] text-[var(--primary-ink)]',
  secondary: 'border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]',
  ghost: 'bg-transparent text-[var(--ink)]',
};

const baseClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 font-semibold';

export function Button({
  variant = 'primary',
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [baseClass, variantClasses[variant], className].filter(Boolean).join(' ');

  return (
    <button type={type} data-variant={variant} className={classes} {...rest}>
      {children}
    </button>
  );
}
