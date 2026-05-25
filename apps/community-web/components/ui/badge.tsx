import { clsx } from 'clsx';

type BadgeProps = {
  children: React.ReactNode;
  tone?: 'primary' | 'secondary' | 'accent' | 'neutral';
};

const toneClass = {
  primary: 'border-synap-primary/20 bg-synap-primary/10 text-synap-primary',
  secondary: 'border-synap-secondary/20 bg-synap-secondary/10 text-synap-secondary',
  accent: 'border-synap-accent/20 bg-synap-accent/10 text-synap-accent',
  neutral: 'border-synap-border bg-white text-synap-muted',
};

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold',
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}
