import type { Job } from 'bullmq';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface DeleteFileData {
  storagePaths: string[];
}

export async function deleteUploadedFile(job: Job<DeleteFileData>) {
  const supabase = createServiceRoleClient();

  for (const path of job.data.storagePaths) {
    if (!path || path.startsWith('http')) continue;

    try {
      await supabase.storage.from('uploads').remove([path]);
    } catch {
      // Non-critical — file may already be deleted
    }
  }
}
