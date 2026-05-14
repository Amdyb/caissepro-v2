export const DEMO_DATA_TEMPLATES = {
  retail: {
    products: [
      { name: 'iPhone 15 Pro Max', price: 925000, stock: 8 },
      { name: 'Casque Bluetooth JBL', price: 45000, stock: 17 },
      { name: 'Parfum Dubai Luxury', price: 25000, stock: 26 },
      { name: 'SOFI Vape', price: 12000, stock: 42 }
    ],
    customers: [
      { full_name: 'Moussa Ndiaye', debt_balance: 15000 },
      { full_name: 'Fatou Diallo', debt_balance: 0 },
      { full_name: 'Awa Ba', debt_balance: 5000 }
    ],
    sales: [
      { total: 12000 },
      { total: 45000 },
      { total: 25000 },
      { total: 180000 }
    ]
  },

  restaurant: {
    products: [
      { name: 'Thiéboudiène Royal', price: 4500, stock: 50 },
      { name: 'Yassa Poulet', price: 3500, stock: 35 },
      { name: 'Burger Maison', price: 5000, stock: 20 }
    ],
    customers: [
      { full_name: 'Cheikh Fall', debt_balance: 0 },
      { full_name: 'Aminata Sarr', debt_balance: 3000 }
    ],
    sales: [
      { total: 4500 },
      { total: 7000 },
      { total: 12000 },
      { total: 9500 }
    ]
  },

  tontine: {
    groups: [
      { name: 'Tontine Famille Dakar', monthly_amount: 25000 },
      { name: 'Business Women Sénégal', monthly_amount: 50000 }
    ],
    members: [
      { full_name: 'Mariama Kane' },
      { full_name: 'Ousmane Sow' },
      { full_name: 'Rosine Traoré' }
    ]
  },

  rental: {
    properties: [
      { name: 'Résidence Almadies', units: 12 },
      { name: 'Villa Liberté 6', units: 4 }
    ],
    tenants: [
      { full_name: 'Ibrahima Diop' },
      { full_name: 'Aissatou Ndiaye' }
    ],
    payments: [
      { total: 250000 },
      { total: 175000 }
    ]
  }
}
