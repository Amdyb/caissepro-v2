import { supabase } from '@/lib/supabaseClient'

export async function logError(source: string, error: any, businessId?: string | null) {
  try {
    const message = typeof error === 'string'
      ? error
      : error?.message || 'Unknown error'

    await supabase.from('app_error_logs').insert({
      source,
      business_id: businessId || null,
      message,
      details: {
        stack: error?.stack || null,
        raw: JSON.stringify(error, null, 2)
      }
    })
  } catch (e) {
    console.error('Failed to log error', e)
  }
}
