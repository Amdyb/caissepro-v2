import { supabase } from '@/lib/supabaseClient'
import { DEMO_DATA_TEMPLATES } from '@/lib/demoDataTemplates'

export async function seedDemoBusiness(businessId: string, type: string) {
  const template: any = DEMO_DATA_TEMPLATES[type as keyof typeof DEMO_DATA_TEMPLATES]

  if (!template) return

  try {
    if (template.products?.length) {
      const products = template.products.map((product: any) => ({
        business_id: businessId,
        name: product.name,
        price: product.price,
        stock: product.stock || 0
      }))

      await supabase.from('products').insert(products)
    }

    if (template.customers?.length) {
      const customers = template.customers.map((customer: any) => ({
        business_id: businessId,
        full_name: customer.full_name,
        debt_balance: customer.debt_balance || 0
      }))

      await supabase.from('customers').insert(customers)
    }

    if (template.sales?.length) {
      const sales = template.sales.map((sale: any) => ({
        business_id: businessId,
        total: sale.total,
        payment_method: 'cash'
      }))

      await supabase.from('sales').insert(sales)
    }

    if (template.groups?.length) {
      const groups = template.groups.map((group: any) => ({
        business_id: businessId,
        name: group.name,
        monthly_amount: group.monthly_amount
      }))

      await supabase.from('tontine_groups').insert(groups)
    }

    if (template.members?.length) {
      const members = template.members.map((member: any) => ({
        business_id: businessId,
        full_name: member.full_name
      }))

      await supabase.from('tontine_members').insert(members)
    }

    if (template.properties?.length) {
      const properties = template.properties.map((property: any) => ({
        business_id: businessId,
        name: property.name,
        units: property.units
      }))

      await supabase.from('properties').insert(properties)
    }

    if (template.tenants?.length) {
      const tenants = template.tenants.map((tenant: any) => ({
        business_id: businessId,
        full_name: tenant.full_name
      }))

      await supabase.from('tenants').insert(tenants)
    }
  } catch (error) {
    console.error('Demo seed error', error)
  }
}
