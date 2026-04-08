import { useState, useMemo } from 'react'
import { useStockData } from '../hooks/useStockData.js'
import { applyFilters, getSectors } from '../utils/filters.js'
import StockCard from './StockCard.jsx'
import StockDetail from './StockDetail.jsx'
import FilterSheet, { DEFAULT_FILTERS } from './FilterSheet.jsx'

export default function StockList() {
  const { data, isLoading, error } = useStockData()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedStock, setSelectedStock] = useState(null)
  const [showFilter, setShowFilter] = useState(false)

  const sectors = useMemo(() => data ? getSectors(data.stocks) : [], [data])
  const filtered = useMemo(
    () => data ? applyFilters(data.stocks, filters) : [],
    [data, filters]
  )
  const activeFilterCount = [
    filters.market !== 'all',
    filters.minRevGrowth > -100 || filters.maxRevGrowth < 500,
    filters.minOpGrowth > -100 || filters.maxOpGrowth < 500,
    filters.minVolume > 0,
    filters.sectors.length > 0,
  ].filter(Boolean).length

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <div className="text-4xl mb-3">⟳</div>
        <p className="text-sm">데이터 로딩 중...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="text-center text-gray-400">
        <p className="text-sm">데이터를 불러올 수 없습니다</p>
        <p className="text-xs mt-1 text-gray-600">{error.message}</p>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 bg-gray-950">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-white font-bold text-lg">종목 리스트</h1>
            {data?.meta?.updated_at && (
              <p className="text-gray-500 text-xs">
                업데이트: {new Date(data.meta.updated_at).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>
          <span className="text-gray-400 text-sm">{filtered.length}개</span>
        </div>

        {/* Search */}
        <input
          type="text"
          value={filters.searchQuery}
          onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
          placeholder="종목명 또는 코드 검색"
          className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none"
        />
      </div>

      {/* Stock Cards */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 pb-24">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 pt-12 text-sm">
            조건에 맞는 종목이 없습니다
          </div>
        ) : (
          filtered.map(stock => (
            <StockCard key={stock.ticker} stock={stock} onClick={setSelectedStock} />
          ))
        )}
      </div>

      {/* Filter FAB */}
      <button
        onClick={() => setShowFilter(true)}
        className="fixed bottom-20 right-4 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-xl"
      >
        {activeFilterCount > 0 ? (
          <span className="relative">
            ⚙
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          </span>
        ) : '⚙'}
      </button>

      {showFilter && (
        <FilterSheet
          filters={filters}
          sectors={sectors}
          onChange={setFilters}
          onClose={() => setShowFilter(false)}
        />
      )}

      {selectedStock && (
        <StockDetail stock={selectedStock} onClose={() => setSelectedStock(null)} />
      )}
    </div>
  )
}
