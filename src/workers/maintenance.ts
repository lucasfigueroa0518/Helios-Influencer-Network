import type { Job } from 'bullmq';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { decrypt, encrypt } from '@/lib/encryption';
import { refreshLongLivedToken } from '@/lib/instagram/auth';
import { getInstagramProfile } from '@/lib/instagram/api';
import { addDays, subDays } from 'date-fns';

export async function maintenanceJobs(_job: Job) {
  const supabase = createServiceRoleClient();

  // 1. Token refresh — tokens expiring within 7 days
  const sevenDaysOut = addDays(new Date(), 7).toISOString();
  const { data: expiringAccounts } = await supabase
    .from('accounts')
    .select('*')
    .lt('token_expires_at', sevenDaysOut)
    .eq('is_active', true)
    .not('access_token_enc', 'is', null);

  for (const account of expiringAccounts ?? []) {
    if (!account.access_token_enc || !account.token_iv) continue;
    try {
      const token = decrypt(account.access_token_enc, account.token_iv);
      const newToken = await refreshLongLivedToken(token);
      const { encrypted, iv } = encrypt(newToken.access_token);

      await supabase.from('accounts').update({
        access_token_enc: encrypted,
        token_iv: iv,
        token_expires_at: addDays(new Date(), 60).toISOString(),
        token_refresh_at: new Date().toISOString(),
        api_status: 'healthy',
      }).eq('id', account.id);
    } catch (error) {
      await supabase.from('accounts').update({
        api_status: 'error',
        error_message: `Token refresh failed: ${(error as Error).message}`,
      }).eq('id', account.id);
    }
  }

  // 2. Cleanup expired topic suggestions
  await supabase
    .from('topic_suggestions')
    .delete()
    .lt('expires_at', new Date().toISOString());

  // 3. Cleanup old job logs (>30 days)
  await supabase
    .from('job_logs')
    .delete()
    .lt('started_at', subDays(new Date(), 30).toISOString());

  // 4. Cleanup old API health logs (>7 days)
  await supabase
    .from('api_health_logs')
    .delete()
    .lt('checked_at', subDays(new Date(), 7).toISOString());

  // 5. Health check all active accounts
  const { data: activeAccounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .not('access_token_enc', 'is', null);

  for (const account of activeAccounts ?? []) {
    if (!account.access_token_enc || !account.token_iv || !account.instagram_user_id) continue;
    try {
      const token = decrypt(account.access_token_enc, account.token_iv);
      await getInstagramProfile(token, account.instagram_user_id);
      await supabase.from('accounts').update({
        api_status: 'healthy',
        last_api_check: new Date().toISOString(),
        error_message: null,
      }).eq('id', account.id);
    } catch (error) {
      const msg = (error as Error).message;
      await supabase.from('accounts').update({
        api_status: msg.includes('429') ? 'degraded' : 'error',
        last_api_check: new Date().toISOString(),
        error_message: msg,
      }).eq('id', account.id);
    }
  }
}
