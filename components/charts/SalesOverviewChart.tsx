'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

type Props = {
  data: {
    name: string
    total: number
  }[]

  title: string
  subtitle?: string
}

function cfa(value: number) {
  return `${value.toLocaleString('fr-FR')} CFA`
}

export default function SalesOverviewChart({ data, title, subtitle }: Props) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-950">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
          Live Analytics
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />

            <YAxis
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />

            <Tooltip
              formatter={(value: any) => cfa(Number(value))}
              contentStyle={{
                borderRadius: '18px',
                border: '1px solid #E2E8F0',
                fontWeight: 700
              }}
            />

            <Area
              type="monotone"
              dataKey="total"
              stroke="#16a34a"
              strokeWidth={4}
              fill="url(#sales)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
