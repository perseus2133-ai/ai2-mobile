import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const fmt = (n, digits = 1) => n == null ? '-' : n.toFixed(digits)
const fmtB = (n) => n == null ? '-' : (n / 100000000).toFixed(0) + '억'

const growthColor = (v) => v == null ? '#4b5563' : v >= 20 ? '#10b981' : v >= 0 ? '#3b82f6' : '#ef4444'

export default function StockDetail({ stock, onClose }) {
  if (!stock) return null

  const revenueData = [
    { year: '2025E', value: stock.rev2025, growth: stock.revGrowth2025 },
    { year: '2026E', value: stock.rev2026, growth: stock.revGrowth2026 },
    { year: '2027E', value: stock.rev2027, growth: stock.revGrowth2027 },
  ].filter(d => d.value != null)

  const opData = [
    { year: '2025E', value: stock.op2025, growth: stock.opGrowth2025 },
    { year: '2026E', value: stock.op2026, growth: stock.opGrowth2026 },
    { year: '2027E', value: stock.op2027, growth: stock.opGrowth2027 },
  ].filter(d => d.value != null)

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="bg-gray-900 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-white text-xl font-bold">{stock.name}</h2>
            <span className="text-gray-400 text-sm">{stock.ticker} · {stock.sector} · {stock.market}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>

        <div className="px-5 pb-6 space-y-6">
          {/* Valuation */}
          <div className="grid grid-cols-3 gap-3">
            {[['PER', fmt(stock.per)], ['PBR', fmt(stock.pbr)], ['ROE', `${fmt(stock.roe)}%`]].map(([l, v]) => (
              <div key={l} className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-gray-400 text-xs mb-1">{l}</div>
                <div className="text-white font-bold">{v}</div>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          {revenueData.length > 0 && (
            <div>
              <h3 className="text-gray-300 text-sm font-semibold mb-2">매출액 (억원)</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={revenueData}>
                  <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }}
                    labelStyle={{ color: '#e5e7eb' }}
                    formatter={(v) => [fmtB(v), '매출액']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {revenueData.map((d, i) => (
                      <Cell key={i} fill={growthColor(d.growth)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-3 mt-1">
                {revenueData.map(d => (
                  <div key={d.year} className="text-xs text-center flex-1">
                    <div className="text-gray-500">{d.year}</div>
                    <div style={{ color: growthColor(d.growth) }}>
                      {d.growth != null ? `${d.growth > 0 ? '+' : ''}${fmt(d.growth)}%` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operating Profit Chart */}
          {opData.length > 0 && (
            <div>
              <h3 className="text-gray-300 text-sm font-semibold mb-2">영업이익 (억원)</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={opData}>
                  <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }}
                    labelStyle={{ color: '#e5e7eb' }}
                    formatter={(v) => [fmtB(v), '영업이익']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {opData.map((d, i) => (
                      <Cell key={i} fill={growthColor(d.growth)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-3 mt-1">
                {opData.map(d => (
                  <div key={d.year} className="text-xs text-center flex-1">
                    <div className="text-gray-500">{d.year}</div>
                    <div style={{ color: growthColor(d.growth) }}>
                      {d.growth != null ? `${d.growth > 0 ? '+' : ''}${fmt(d.growth)}%` : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
