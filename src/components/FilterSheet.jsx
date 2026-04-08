export const DEFAULT_FILTERS = {
  market: 'all',
  minRevGrowth: -100,
  maxRevGrowth: 500,
  minOpGrowth: -100,
  maxOpGrowth: 500,
  minVolume: 0,
  sectors: [],
  searchQuery: '',
}

const VOLUME_OPTIONS = [
  { label: '제한 없음', value: 0 },
  { label: '10만+', value: 100000 },
  { label: '50만+', value: 500000 },
  { label: '100만+', value: 1000000 },
]

export default function FilterSheet({ filters, sectors, onChange, onClose }) {
  const toggleSector = (s) => {
    const next = filters.sectors.includes(s)
      ? filters.sectors.filter(x => x !== s)
      : [...filters.sectors, s]
    onChange({ ...filters, sectors: next })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="bg-gray-900 rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg">필터</h2>
          <div className="flex gap-3">
            <button
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="text-gray-400 text-sm"
            >초기화</button>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* Market */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">시장</label>
            <div className="flex gap-2">
              {[['all', '전체'], ['KOSPI', 'KOSPI'], ['KOSDAQ', 'KOSDAQ']].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => onChange({ ...filters, market: v })}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                    filters.market === v
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >{l}</button>
              ))}
            </div>
          </div>

          {/* Revenue Growth */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              매출 성장률 (2025E): {filters.minRevGrowth}% ~ {filters.maxRevGrowth}%
            </label>
            <div className="flex gap-3">
              <input
                type="range" min="-100" max="500" step="5"
                value={filters.minRevGrowth}
                onChange={e => onChange({ ...filters, minRevGrowth: Number(e.target.value) })}
                className="flex-1 accent-blue-500"
              />
              <input
                type="range" min="-100" max="500" step="5"
                value={filters.maxRevGrowth}
                onChange={e => onChange({ ...filters, maxRevGrowth: Number(e.target.value) })}
                className="flex-1 accent-blue-500"
              />
            </div>
          </div>

          {/* Op Profit Growth */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              영업이익 성장률 (2025E): {filters.minOpGrowth}% ~ {filters.maxOpGrowth}%
            </label>
            <div className="flex gap-3">
              <input
                type="range" min="-100" max="500" step="5"
                value={filters.minOpGrowth}
                onChange={e => onChange({ ...filters, minOpGrowth: Number(e.target.value) })}
                className="flex-1 accent-blue-500"
              />
              <input
                type="range" min="-100" max="500" step="5"
                value={filters.maxOpGrowth}
                onChange={e => onChange({ ...filters, maxOpGrowth: Number(e.target.value) })}
                className="flex-1 accent-blue-500"
              />
            </div>
          </div>

          {/* Volume */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">최소 거래량 (20일)</label>
            <div className="flex gap-2 flex-wrap">
              {VOLUME_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => onChange({ ...filters, minVolume: value })}
                  className={`px-3 py-1.5 rounded-xl text-sm ${
                    filters.minVolume === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Sectors */}
          {sectors.length > 0 && (
            <div>
              <label className="text-gray-400 text-sm mb-2 block">
                업종 ({filters.sectors.length === 0 ? '전체' : `${filters.sectors.length}개 선택`})
              </label>
              <div className="flex flex-wrap gap-2">
                {sectors.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSector(s)}
                    className={`px-3 py-1 rounded-full text-xs ${
                      filters.sectors.includes(s)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
