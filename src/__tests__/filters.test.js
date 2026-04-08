import { describe, it, expect } from 'vitest'
import { applyFilters, getSectors } from '../utils/filters.js'

const STOCKS = [
  {
    ticker: 'A', name: '가', market: 'KOSPI', sector: '반도체',
    revGrowth2025: 20, opGrowth2025: 30, avgVolume20d: 500000,
  },
  {
    ticker: 'B', name: '나', market: 'KOSDAQ', sector: '바이오',
    revGrowth2025: 5, opGrowth2025: -10, avgVolume20d: 100000,
  },
  {
    ticker: 'C', name: '다', market: 'KOSPI', sector: '반도체',
    revGrowth2025: null, opGrowth2025: 50, avgVolume20d: 200000,
  },
]

const DEFAULT_FILTERS = {
  market: 'all',
  minRevGrowth: -100,
  maxRevGrowth: 1000,
  minOpGrowth: -100,
  maxOpGrowth: 1000,
  minVolume: 0,
  sectors: [],
  searchQuery: '',
}

describe('applyFilters', () => {
  it('returns all stocks with default filters', () => {
    expect(applyFilters(STOCKS, DEFAULT_FILTERS)).toHaveLength(3)
  })

  it('filters by market KOSPI', () => {
    const result = applyFilters(STOCKS, { ...DEFAULT_FILTERS, market: 'KOSPI' })
    expect(result).toHaveLength(2)
    expect(result.every(s => s.market === 'KOSPI')).toBe(true)
  })

  it('filters by minimum revenue growth', () => {
    const result = applyFilters(STOCKS, { ...DEFAULT_FILTERS, minRevGrowth: 10 })
    // A passes (20), B fails (5), C has null revGrowth so excluded
    expect(result).toHaveLength(1)
    expect(result[0].ticker).toBe('A')
  })

  it('filters by minimum volume', () => {
    const result = applyFilters(STOCKS, { ...DEFAULT_FILTERS, minVolume: 300000 })
    expect(result).toHaveLength(1)
    expect(result[0].ticker).toBe('A')
  })

  it('filters by sector list', () => {
    const result = applyFilters(STOCKS, { ...DEFAULT_FILTERS, sectors: ['바이오'] })
    expect(result).toHaveLength(1)
    expect(result[0].ticker).toBe('B')
  })

  it('filters by search query on name', () => {
    const result = applyFilters(STOCKS, { ...DEFAULT_FILTERS, searchQuery: '가' })
    expect(result).toHaveLength(1)
    expect(result[0].ticker).toBe('A')
  })

  it('filters by search query on ticker', () => {
    const result = applyFilters(STOCKS, { ...DEFAULT_FILTERS, searchQuery: 'B' })
    expect(result).toHaveLength(1)
    expect(result[0].ticker).toBe('B')
  })
})

describe('getSectors', () => {
  it('returns unique sorted sectors', () => {
    expect(getSectors(STOCKS)).toEqual(['바이오', '반도체'])
  })
})
