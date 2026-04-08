import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useStockData } from '../hooks/useStockData.js'

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
                 '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1']

export default function SectorAnalysis() {
  const { data, isLoading } = useStockData()

  const sectorData = useMemo(() => {
    if (!data) return []
    const map = {}
    data.stocks.forEach(s => {
      if (!s.sector) return
      if (!map[s.sector]) map[s.sector] = { sector: s.sector, count: 0, revSum: 0, revCount: 0 }
      map[s.sector].count++
      if (s.revGrowth2025 != null) {
        map[s.sector].revSum += s.revGrowth2025
        map[s.sector].revCount++
      }
    })
    return Object.values(map)
      .map(d => ({ ...d, avgRevGrowth: d.revCount > 0 ? d.revSum / d.revCount : null }))
      .filter(d => d.avgRevGrowth != null)
      .sort((a, b) => b.avgRevGrowth - a.avgRevGrowth)
      .slice(0, 15)
  }, [data])

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      로딩 중...
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
      <h1 className="text-white font-bold text-lg mb-1">섹터 분석</h1>
      <p className="text-gray-500 text-xs mb-4">평균 매출 성장률 기준 Top 15 섹터</p>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={sectorData} layout="vertical" margin={{ left: 0, right: 16 }}>
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} unit="%" />
          <YAxis
            type="category"
            dataKey="sector"
            tick={{ fill: '#d1d5db', fontSize: 11 }}
            width={80}
          />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }}
            formatter={(v) => [`${v.toFixed(1)}%`, '평균 매출성장률']}
          />
          <Bar dataKey="avgRevGrowth" radius={[0, 4, 4, 0]}>
            {sectorData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-2">
        {sectorData.map((d, i) => (
          <div key={d.sector} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-5">{i + 1}</span>
              <span className="text-white text-sm">{d.sector}</span>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-gray-400">{d.count}개</span>
              <span className={d.avgRevGrowth >= 10 ? 'text-emerald-400' : 'text-blue-400'}>
                +{d.avgRevGrowth.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
