import useSWR from 'swr'
import { supabase } from '@/lib/supabaseClient'

async function fetchCustomers(businessId: string) {
  const { data } = await supabase
    .from('customers')
    .select('id, business_id, full_name, phone, debt_balance, total_spent, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return (data || []) as any[]
}

export function useCustomers(businessId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    businessId ? `customers-${businessId}` : null,
    () => fetchCustomers(businessId!),
    { revalidateOnFocus: false }
  )
  return { customers: data || [], loading: isLoading, error, mutate }
}
