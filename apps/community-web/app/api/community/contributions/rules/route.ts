import { getCommunityReputationModel } from '@/lib/community-reputation';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(getCommunityReputationModel(), {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
