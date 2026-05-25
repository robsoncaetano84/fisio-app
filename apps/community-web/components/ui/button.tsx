import Link from 'next/link';
import { clsx } from 'clsx';

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
};

const variantClass = {
  primary:
    'bg-synap-primary text-white shadow-subtle hover:bg-synap-primaryDark',
  secondary:
    'border border-synap-border bg-white text-synap-text hover:border-synap-primary/40',
  ghost: 'text-synap-muted hover:bg-synap-primary/10 hover:text-synap-primary',
};

export function Button({
  children,
  href,
  variant = 'primary',
  className,
}: ButtonProps) {
  const classes = clsx(
    'focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-synap px-4 text-sm font-semibold transition',
    variantClass[variant],
    className,
  );

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    );
  }

  return <button className={classes}>{children}</button>;
}
