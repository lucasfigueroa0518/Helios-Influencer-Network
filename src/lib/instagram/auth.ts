const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI!;

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

  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  user_id: string;
}> {
  const params = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    client_secret: INSTAGRAM_APP_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    code,
  });

  const res = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: params,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Instagram token exchange failed: ${JSON.stringify(error)}`);
  }

  return res.json();
}

export async function getLongLivedToken(shortLivedToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: INSTAGRAM_APP_SECRET,
    access_token: shortLivedToken,
  });

  const res = await fetch(
    `https://graph.instagram.com/access_token?${params.toString()}`
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
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: currentToken,
  });

  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?${params.toString()}`
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
  }

  return res.json();
}
