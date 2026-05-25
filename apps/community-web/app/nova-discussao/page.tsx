import { CommunityShell } from '@/components/community/community-shell';
import { NewDiscussionForm } from '@/features/discussions/new-discussion-form';
import { getCommunityCategories } from '@/lib/community-api';

export const metadata = {
  title: 'Nova discussão',
};

export default async function NewDiscussionPage() {
  const categories = await getCommunityCategories();

  return (
    <CommunityShell>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <NewDiscussionForm categories={categories} />
      </main>
    </CommunityShell>
  );
}
