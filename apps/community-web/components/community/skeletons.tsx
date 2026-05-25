import { CommunityShell } from '@/components/community/community-shell';

export function CommunityHomeSkeleton() {
  return (
    <CommunityShell>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
        <section className="min-w-0 space-y-4">
          <SkeletonBlock className="h-44" />
          <SkeletonLine className="h-6 w-56" />
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock className="h-40" key={index} />
          ))}
        </section>
        <aside className="space-y-4">
          <SkeletonBlock className="h-72" />
          <SkeletonBlock className="h-36" />
        </aside>
      </main>
    </CommunityShell>
  );
}

export function DiscussionSkeleton() {
  return (
    <CommunityShell>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <SkeletonBlock className="h-80" />
        <div className="mt-6 space-y-3">
          <SkeletonLine className="h-6 w-36" />
          <SkeletonBlock className="h-36" />
          <SkeletonBlock className="h-32" />
        </div>
      </main>
    </CommunityShell>
  );
}

export function ListPageSkeleton() {
  return (
    <CommunityShell>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <SkeletonLine className="h-7 w-48" />
        <SkeletonLine className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock className="h-32" key={index} />
          ))}
        </div>
      </main>
    </CommunityShell>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-synap border border-synap-border bg-white shadow-subtle ${className}`}
    />
  );
}

function SkeletonLine({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-synap-border/80 ${className}`}
    />
  );
}
