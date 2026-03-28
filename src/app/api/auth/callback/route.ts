import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { exchangeCodeForToken, getLongLivedToken } from '@/lib/instagram/auth';
import { getInstagramProfile, getInstagramPages } from '@/lib/instagram/api';
import { encrypt } from '@/lib/encryption';
import { addDays } from 'date-fns';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const accountId = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (errorParam) {
    return NextResponse.redirect(`${appUrl}/accounts?error=oauth_denied`);
  }

  if (!code || !accountId) {
    return NextResponse.redirect(`${appUrl}/accounts?error=missing_params`);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${appUrl}/login`);
    }

    const shortToken = await exchangeCodeForToken(code);
    const longToken = await getLongLivedToken(shortToken.access_token);

    const pages = await getInstagramPages(longToken.access_token);
    const igAccount = pages.find((p) => p.instagram_business_account)?.instagram_business_account;

    if (!igAccount) {
      return NextResponse.redirect(`${appUrl}/accounts?error=no_business_account`);
    }

    const existing = await supabase
      .from('accounts')
      .select('id')
      .eq('instagram_user_id', igAccount.id)
      .single();

    if (existing.data && existing.data.id !== accountId) {
      return NextResponse.redirect(`${appUrl}/accounts?error=duplicate_account`);
    }

    const profile = await getInstagramProfile(longToken.access_token, igAccount.id);
    const { encrypted, iv } = encrypt(longToken.access_token);

    await supabase.from('accounts').update({
      instagram_user_id: igAccount.id,
      instagram_username: profile.username,
      avatar_url: profile.profile_picture_url,
      bio: profile.biography,
      access_token_enc: encrypted,
      token_iv: iv,
      token_expires_at: addDays(new Date(), 60).toISOString(),
      token_refresh_at: new Date().toISOString(),
      api_status: 'healthy',
      last_api_check: new Date().toISOString(),
      error_message: null,
    }).eq('id', accountId);

    return NextResponse.redirect(`${appUrl}/accounts?connected=true`);
  } catch (err) {
    console.error('Instagram OAuth callback error:', err);
    return NextResponse.redirect(`${appUrl}/accounts?error=oauth_failed`);
  }
}
