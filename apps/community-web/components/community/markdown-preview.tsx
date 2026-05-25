import { clsx } from 'clsx';

type MarkdownPreviewProps = {
  value: string;
  emptyText?: string;
  className?: string;
  variant?: 'panel' | 'plain';
};

export function MarkdownPreview({
  value,
  emptyText = 'A previa do conteudo aparecera aqui.',
  className,
  variant = 'panel',
}: MarkdownPreviewProps) {
  const lines = value.replace(/\r\n/g, '\n').split('\n');
  const hasContent = lines.some((line) => line.trim());

  if (!hasContent) {
    return (
      <div
        className={clsx(
          variant === 'panel'
            ? 'rounded-synap border border-dashed border-synap-border bg-synap-background p-4'
            : 'py-2',
          'text-sm font-semibold text-synap-muted',
          className,
        )}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        variant === 'panel'
          ? 'rounded-synap border border-synap-border bg-white p-4'
          : 'py-2',
        'text-sm leading-7 text-synap-text',
        className,
      )}
    >
      {lines.map((line, index) => renderLine(line, index))}
    </div>
  );
}

function renderLine(line: string, index: number) {
  const trimmed = line.trim();

  if (!trimmed) {
    return <div aria-hidden="true" className="h-3" key={index} />;
  }

  if (trimmed.startsWith('### ')) {
    return (
      <h4 className="mt-4 text-sm font-extrabold text-synap-text" key={index}>
        {trimmed.slice(4)}
      </h4>
    );
  }

  if (trimmed.startsWith('## ')) {
    return (
      <h3 className="mt-5 text-base font-extrabold text-synap-text" key={index}>
        {trimmed.slice(3)}
      </h3>
    );
  }

  if (trimmed.startsWith('# ')) {
    return (
      <h2 className="mt-5 text-lg font-extrabold text-synap-text" key={index}>
        {trimmed.slice(2)}
      </h2>
    );
  }

  if (/^[-*]\s+/.test(trimmed)) {
    return (
      <div className="flex gap-2" key={index}>
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-synap-primary" />
        <p>{trimmed.replace(/^[-*]\s+/, '')}</p>
      </div>
    );
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    const [number] = trimmed.split('.');
    return (
      <div className="flex gap-2" key={index}>
        <span className="shrink-0 font-extrabold text-synap-primary">
          {number}.
        </span>
        <p>{trimmed.replace(/^\d+\.\s+/, '')}</p>
      </div>
    );
  }

  if (trimmed.startsWith('> ')) {
    return (
      <blockquote
        className="border-l-4 border-synap-secondary bg-synap-background py-2 pl-3 text-synap-muted"
        key={index}
      >
        {trimmed.slice(2)}
      </blockquote>
    );
  }

  return (
    <p className="text-sm leading-7 text-synap-text" key={index}>
      {trimmed}
    </p>
  );
}
