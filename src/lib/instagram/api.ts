const GRAPH_API_BASE = 'https://graph.instagram.com/v21.0';

export interface IGProfile {
  id: string;
  username: string;
  name: string;
  biography: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
}

export async function getInstagramProfile(
  accessToken: string,
  igUserId: string
): Promise<IGProfile> {
  const fields = 'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count';
  const res = await fetch(
    `${GRAPH_API_BASE}/${igUserId}?fields=${fields}&access_token=${accessToken}`
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
  }

  return res.json();
}

export async function getInstagramPages(accessToken: string): Promise<
  Array<{ id: string; instagram_business_account?: { id: string } }>
> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account&access_token=${accessToken}`
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Facebook Pages API error: ${JSON.stringify(error)}`);
  }

  const data = await res.json();
  return data.data ?? [];
}

export async function getPostInsights(
  accessToken: string,
  mediaId: string
): Promise<{
  likes: number;
  comments: number;
  reach: number;
  impressions: number;
  saved: number;
  shares: number;
}> {
  const metrics = 'likes,comments,reach,impressions,saved,shares';
  const res = await fetch(
    `${GRAPH_API_BASE}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`
  );

  if (!res.ok) {
    return { likes: 0, comments: 0, reach: 0, impressions: 0, saved: 0, shares: 0 };
  }

  const data = await res.json();
  const result: Record<string, number> = {};
  for (const item of data.data ?? []) {
    result[item.name] = item.values?.[0]?.value ?? 0;
  }

  return {
    likes: result.likes ?? 0,
    comments: result.comments ?? 0,
    reach: result.reach ?? 0,
    impressions: result.impressions ?? 0,
    saved: result.saved ?? 0,
    shares: result.shares ?? 0,
  };
}
