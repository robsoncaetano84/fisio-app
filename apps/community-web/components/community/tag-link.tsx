import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { CommunityTag } from '@/lib/community-api';

export function TagLink({ tag }: { tag: CommunityTag }) {
  return (
    <Link className="transition hover:brightness-95" href={`/tags/${tag.slug}`}>
      <Badge>{tag.name}</Badge>
    </Link>
  );
}
