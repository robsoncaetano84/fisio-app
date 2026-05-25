import { BookOpenCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyFeed() {
  return (
    <div className="rounded-synap border border-dashed border-synap-border bg-white p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-synap bg-synap-primary/10 text-synap-primary">
        <BookOpenCheck className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-extrabold text-synap-text">
        Nenhuma discussão publicada ainda
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-synap-muted">
        A comunidade está pronta para receber dúvidas clínicas, referências e discussões técnicas.
      </p>
      <div className="mt-5">
        <Button href="/nova-discussao">Criar primeira discussão</Button>
      </div>
    </div>
  );
}
