import { useQuery } from '@tanstack/react-query'
import Papa from 'papaparse'

const BASE_URL = 'https://raw.githubusercontent.com/perseus2133-ai/ai2/main/data'

const toFloat = (val) => {
  if (val === '' || val === 'N/A' || val === null || val === undefined) return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

export const parseStockRow = (row) => {
  if (!row['종목명'] || !row['종목코드']) return null
  return {
    ticker: row['종목코드']?.trim(),
    name: row['종목명']?.trim(),
    sector: row['업종']?.trim() || '기타',
    market: row['시장']?.trim(),
    revGrowth2025: toFloat(row['매출액_성장률_2025']),
    revGrowth2026: toFloat(row['매출액_성장률_2026']),
    revGrowth2027: toFloat(row['매출액_성장률_2027']),
    maxRevGrowth: toFloat(row['매출액_최대성장률']),
    opGrowth2025: toFloat(row['영업이익_성장률_2025']),
    opGrowth2026: toFloat(row['영업이익_성장률_2026']),
    opGrowth2027: toFloat(row['영업이익_성장률_2027']),
    maxOpGrowth: toFloat(row['영업이익_최대성장률']),
    per: toFloat(row['PER']),
    pbr: toFloat(row['PBR']),
    roe: toFloat(row['ROE']),
    avgVolume20d: toFloat(row['평균거래량_20d']),
    price: toFloat(row['현재가']),
    marketCap: toFloat(row['시가총액']),
    volumeMultiple: toFloat(row['거래량배수']),
    rev2025: toFloat(row['매출액_2025']),
    rev2026: toFloat(row['매출액_2026']),
    rev2027: toFloat(row['매출액_2027']),
    op2025: toFloat(row['영업이익_2025']),
    op2026: toFloat(row['영업이익_2026']),
    op2027: toFloat(row['영업이익_2027']),
  }
}

const fetchStocks = async () => {
  const [csvRes, metaRes] = await Promise.all([
    fetch(`${BASE_URL}/consensus_data.csv`),
    fetch(`${BASE_URL}/meta.json`),
  ])
  if (!csvRes.ok) throw new Error('CSV fetch failed')
  const csvText = await csvRes.text()
  const meta = metaRes.ok ? await metaRes.json() : {}

  const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true })
  const stocks = data.map(parseStockRow).filter(Boolean)
  return { stocks, meta }
}

export const useStockData = () =>
  useQuery({ queryKey: ['stocks'], queryFn: fetchStocks })
