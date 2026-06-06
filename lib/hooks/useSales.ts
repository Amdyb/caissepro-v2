import useSWR from 'swr'
import { supabase } from '@/lib/supabaseClient'

async function fetchSales(businessId: string) {
  const { data } = await supabase
    .from('sales')
    .select('id, business_id, customer_id, total, paid_amount, remaining_amount, payment_method, status, receipt_number, created_at, customers(full_name, phone)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(500)
  return (data || []) as any[]
}

export function useSales(businessId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    businessId ? `sales-${businessId}` : null,
    () => fetchSales(businessId!),
    { refreshInterval: 30000, revalidateOnFocus: false }
  )
  return { sales: data || [], loading: isLoading, error, mutate }
}
