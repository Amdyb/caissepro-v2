// IndexedDB offline store for CaissePro
// Saves pending operations when offline and syncs them when connection is restored.

const DB_NAME = 'caissepro-offline'
const DB_VERSION = 1

export type PendingSale = {
  localId: string
  business_id: string
  total: number
  paid_amount: number
  remaining_amount: number
  customer_id: string | null
  payment_method: string
  status: string
  created_at: string
  items: {
    product_id: string
    product_name: string
    product_image: string | null
    unit_price: number
    quantity: number
    price: number
    total: number
  }[]
  stock_updates: { product_id: string; new_stock: number }[]
}

export type PendingCustomer = {
  localId: string
  business_id: string
  full_name: string
  phone: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('pending_sales')) {
        db.createObjectStore('pending_sales', { keyPath: 'localId' })
      }
      if (!db.objectStoreNames.contains('pending_customers')) {
        db.createObjectStore('pending_customers', { keyPath: 'localId' })
      }
    }
  })
}

async function idbPut(store: string, item: object): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).put(item)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function idbGetAll<T>(store: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

async function idbDelete(store: string, key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function emitQueueChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('offline-queue-changed'))
  }
}

export async function savePendingSale(sale: PendingSale): Promise<void> {
  await idbPut('pending_sales', sale)
  emitQueueChanged()
}

export async function savePendingCustomer(customer: PendingCustomer): Promise<void> {
  await idbPut('pending_customers', customer)
  emitQueueChanged()
}

export async function getPendingCounts(): Promise<{ sales: number; customers: number; total: number }> {
  try {
    const [sales, customers] = await Promise.all([
      idbGetAll<PendingSale>('pending_sales'),
      idbGetAll<PendingCustomer>('pending_customers'),
    ])
    return { sales: sales.length, customers: customers.length, total: sales.length + customers.length }
  } catch {
    return { sales: 0, customers: 0, total: 0 }
  }
}

export type SyncResult = { synced: number; errors: number }

export async function syncPendingData(supabase: any): Promise<SyncResult> {
  let synced = 0
  let errors = 0

  // Sync pending customers first (sales may reference them)
  const pendingCustomers = await idbGetAll<PendingCustomer>('pending_customers')
  for (const c of pendingCustomers) {
    try {
      const { localId, ...data } = c
      const { error } = await supabase.from('customers').insert(data)
      if (!error) {
        await idbDelete('pending_customers', localId)
        synced++
      } else {
        errors++
      }
    } catch {
      errors++
    }
  }

  // Sync pending sales + items + stock updates
  const pendingSales = await idbGetAll<PendingSale>('pending_sales')
  for (const s of pendingSales) {
    try {
      const { localId, items, stock_updates, ...saleData } = s

      const { data: inserted, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select('id')
        .single()

      if (saleError || !inserted) {
        errors++
        continue
      }

      // Insert sale items
      const saleItems = items.map(item => ({ ...item, sale_id: inserted.id }))
      await supabase.from('sale_items').insert(saleItems)

      // Apply stock updates
      for (const { product_id, new_stock } of stock_updates) {
        await supabase.from('products').update({ stock: new_stock }).eq('id', product_id)
      }

      await idbDelete('pending_sales', localId)
      synced++
    } catch {
      errors++
    }
  }

  emitQueueChanged()
  return { synced, errors }
}
