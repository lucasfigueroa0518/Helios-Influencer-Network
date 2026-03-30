import { GRAPH_API_VERSION, GRAPH_FACEBOOK_API_BASE } from '@/lib/instagram/constants';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI!;

/**
 * Facebook Login OAuth (not api.instagram.com) — required for Instagram Graph API
 * scopes and graph.facebook.com/me/accounts.
 */
export function getInstagramAuthUrl(accountId: string): string {
  const scopes = [
    'instagram_basic',
    'pages_show_list',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'instagram_content_publish',
  ].join(',');

  const params = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    scope: scopes,
    response_type: 'code',
    state: accountId,
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

/** Exchange authorization code for a short-lived Facebook user access token. */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type?: string;
  expires_in?: number;
}> {
  const params = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    client_secret: INSTAGRAM_APP_SECRET,
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    code,
  });

  const url = `${GRAPH_FACEBOOK_API_BASE}/oauth/access_token?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Facebook token exchange failed: ${JSON.stringify(error)}`);
  }

  return res.json();
}

/** Exchange short- or long-lived user token for a long-lived user token (~60 days). */
export async function getLongLivedToken(userToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: INSTAGRAM_APP_ID,
    client_secret: INSTAGRAM_APP_SECRET,
    fb_exchange_token: userToken,
  });

  const res = await fetch(
    `${GRAPH_FACEBOOK_API_BASE}/oauth/access_token?${params.toString()}`
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Long-lived token exchange failed: ${JSON.stringify(error)}`);
  }

  return res.json();
}

export async function refreshLongLivedToken(currentToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  return getLongLivedToken(currentToken);
}
