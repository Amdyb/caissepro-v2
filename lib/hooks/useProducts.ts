import useSWR from 'swr'
import { supabase } from '@/lib/supabaseClient'

async function fetchProducts(businessId: string) {
  const { data } = await supabase
    .from('products')
    .select('id, business_id, name, barcode, category, cost_price, sell_price, minimum_price, stock, image, created_at, is_active, archived, deleted_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return (data || []) as any[]
}

export function useProducts(businessId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    businessId ? `products-${businessId}` : null,
    () => fetchProducts(businessId!),
    { refreshInterval: 60000, revalidateOnFocus: false }
  )
  return { products: data || [], loading: isLoading, error, mutate }
}
