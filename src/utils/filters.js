export const applyFilters = (stocks, filters) => {
  const { market, minRevGrowth, maxRevGrowth, minOpGrowth, maxOpGrowth,
          minVolume, sectors, searchQuery } = filters
  const query = searchQuery.toLowerCase()

  return stocks.filter(s => {
    if (market !== 'all' && s.market !== market) return false
    if (s.revGrowth2025 === null && minRevGrowth > -100) return false
    if (s.revGrowth2025 !== null && (s.revGrowth2025 < minRevGrowth || s.revGrowth2025 > maxRevGrowth)) return false
    if (s.opGrowth2025 !== null && (s.opGrowth2025 < minOpGrowth || s.opGrowth2025 > maxOpGrowth)) return false
    if (s.avgVolume20d !== null && s.avgVolume20d < minVolume) return false
    if (sectors.length > 0 && !sectors.includes(s.sector)) return false
    if (query && !s.name.toLowerCase().includes(query) && !s.ticker.toLowerCase().includes(query)) return false
    return true
  })
}

export const getSectors = (stocks) =>
  [...new Set(stocks.map(s => s.sector))].sort()
