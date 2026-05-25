import { getCommunityOpenApiDocument } from '@/lib/community-openapi';

export const dynamic = 'force-static';

export function GET() {
  return Response.json(getCommunityOpenApiDocument(), {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
