import { supabase } from '@/lib/supabaseClient'
import { logError } from '@/lib/logError'

export async function generateDailyAnalyticsSnapshot(businessId: string, date = new Date()) {
  try {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const [salesResult, ordersResult, customersResult, productsResult] = await Promise.all([
      supabase
        .from('sales')
        .select('total,created_at')
        .eq('business_id', businessId)
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString()),
      supabase
        .from('orders')
        .select('id,total,created_at')
        .eq('business_id', businessId)
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString()),
      supabase
        .from('customers')
        .select('id')
        .eq('business_id', businessId),
      supabase
        .from('products')
        .select('id,stock')
        .eq('business_id', businessId)
    ])

    const sales = salesResult.data || []
    const orders = ordersResult.data || []
    const customers = customersResult.data || []
    const products = productsResult.data || []

    const totalSales = sales.reduce((sum: number, sale: any) => sum + Number(sale.total || 0), 0)
    const totalOrders = orders.length
    const totalCustomers = customers.length
    const lowStockCount = products.filter((product: any) => Number(product.stock || 0) <= 5).length

    const snapshotDate = start.toISOString().slice(0, 10)

    const { error } = await supabase
      .from('analytics_daily_snapshots')
      .upsert({
        business_id: businessId,
        snapshot_date: snapshotDate,
        total_sales: totalSales,
        total_orders: totalOrders,
        total_customers: totalCustomers,
        low_stock_count: lowStockCount
      }, { onConflict: 'business_id,snapshot_date' })

    if (error) throw error

    return {
      totalSales,
      totalOrders,
      totalCustomers,
      lowStockCount,
      snapshotDate
    }
  } catch (error) {
    await logError('analytics-daily-snapshot', error, businessId)
    throw error
  }
}

export async function generateAnalyticsForAllBusinesses() {
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id')

  if (error) throw error

  const results = []

  for (const business of businesses || []) {
    try {
      results.push(await generateDailyAnalyticsSnapshot(business.id))
    } catch (error) {
      await logError('analytics-all-businesses', error, business.id)
    }
  }

  return results
}
