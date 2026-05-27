import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Supabase storage operations will fail.');
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = createSupabaseClient();

/**
 * Delete a public storage object given a full public URL from Supabase.
 * Attempts to parse the bucket and path from common Supabase public URLs.
 */
export async function deletePublicFileByUrl(fileUrl?: string | null) {
  if (!fileUrl) return;

  if (!supabase) {
    throw new Error('Supabase client is not initialized. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.');
  }

  try {
    const url = new URL(fileUrl);
    const storagePrefix = '/storage/v1/object/public/';
    const idx = url.pathname.indexOf(storagePrefix);

    if (idx === -1) {
      throw new Error('No Supabase storage path detected in file URL');
    }

    const after = url.pathname.slice(idx + storagePrefix.length);
    const [bucket, ...rest] = after.split('/');
    const path = rest.join('/');

    if (!bucket || !path) {
      throw new Error('Could not extract bucket or path from Supabase file URL');
    }

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw error;
    }
  } catch (err) {
    throw err;
  }
}
