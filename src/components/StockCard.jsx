const fmt = (n, digits = 1) => n == null ? '-' : n.toFixed(digits)
const fmtVol = (n) => {
  if (n == null) return '-'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toFixed(0)
}

const GrowthBadge = ({ value, label }) => {
  const color = value == null ? 'bg-gray-700 text-gray-400'
    : value >= 20 ? 'bg-emerald-900 text-emerald-300'
    : value >= 0 ? 'bg-blue-900 text-blue-300'
    : 'bg-red-900 text-red-300'
  return (
    <div className={`rounded-lg px-2 py-1 text-center ${color}`}>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm font-bold">{value == null ? '-' : `${fmt(value)}%`}</div>
    </div>
  )
}

export default function StockCard({ stock, onClick }) {
  return (
    <button
      onClick={() => onClick(stock)}
      className="w-full bg-gray-800 rounded-2xl p-4 text-left active:scale-95 transition-transform"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-white font-semibold text-base">{stock.name}</span>
          <span className="text-gray-400 text-sm ml-2">{stock.ticker}</span>
        </div>
        <div className="flex gap-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            stock.market === 'KOSPI' ? 'bg-blue-800 text-blue-200' : 'bg-purple-800 text-purple-200'
          }`}>{stock.market}</span>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-3">{stock.sector}</div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <GrowthBadge value={stock.revGrowth2025} label="매출 성장률" />
        <GrowthBadge value={stock.opGrowth2025} label="영업익 성장률" />
      </div>

      <div className="flex gap-4 text-xs text-gray-400">
        <span>PER <span className="text-gray-200">{fmt(stock.per)}</span></span>
        <span>PBR <span className="text-gray-200">{fmt(stock.pbr)}</span></span>
        <span>ROE <span className="text-gray-200">{fmt(stock.roe)}%</span></span>
        <span>거래량 <span className="text-gray-200">{fmtVol(stock.avgVolume20d)}</span></span>
      </div>
    </button>
  )
}
