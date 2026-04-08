import { describe, it, expect } from 'vitest'
import { parseStockRow } from '../hooks/useStockData.js'

const RAW_ROW = {
  종목코드: '005930',
  종목명: '삼성전자',
  매출액_성장률_2025: '5.2',
  매출액_성장률_2026: '8.1',
  영업이익_성장률_2025: '12.3',
  영업이익_성장률_2026: '15.0',
  매출액_최대성장률: '8.1',
  영업이익_최대성장률: '15.0',
  PER: '14.5',
  PBR: '1.2',
  ROE: '8.9',
  평균거래량_20d: '15000000',
  시장: 'KOSPI',
  현재가: '75000',
  시가총액: '4500000',
  업종: '반도체',
  매출액_2025: '320000',
  매출액_2026: '346000',
  매출액_2027: '372000',
  영업이익_2025: '42000',
  영업이익_2026: '48000',
  영업이익_2027: '55000',
  거래량배수: '1.3',
}

describe('parseStockRow', () => {
  it('parses numeric fields from string', () => {
    const stock = parseStockRow(RAW_ROW)
    expect(stock.ticker).toBe('005930')
    expect(stock.name).toBe('삼성전자')
    expect(stock.revGrowth2025).toBe(5.2)
    expect(stock.opGrowth2025).toBe(12.3)
    expect(stock.per).toBe(14.5)
    expect(stock.market).toBe('KOSPI')
    expect(stock.sector).toBe('반도체')
  })

  it('returns null for rows with missing name', () => {
    const result = parseStockRow({ ...RAW_ROW, 종목명: '' })
    expect(result).toBeNull()
  })

  it('handles N/A strings as null', () => {
    const result = parseStockRow({ ...RAW_ROW, PER: 'N/A' })
    expect(result.per).toBeNull()
  })
})
