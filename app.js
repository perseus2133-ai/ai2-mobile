/* ============================================================
   퀀트 모바일 - app.js
   - CSV는 ai2 레포의 raw URL에서 직접 fetch
   - LocalStorage에 30분 캐시 (모바일 데이터 절약)
   ============================================================ */

const CSV_URL = 'https://raw.githubusercontent.com/perseus2133-ai/ai2/main/data/consensus_data.csv';
const PASSWORD = '9084';
const PAGE_SIZE = 10;
const CACHE_KEY = 'qm_csv_cache_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;   // 30분

let allData = [];
let filteredData = [];
let page = 1;

const filters = {
  markets: ['KOSPI', 'KOSDAQ'],
  revThresh: 100,
  opThresh: 100,
  opSize: '1000+',
  minVol: 500000,
  sortKey: 'visibility',
  search: '',
};

/* ============================================================
   인증
   ============================================================ */
function checkAuth() {
  if (sessionStorage.getItem('qm_auth') === '1') {
    showApp();
  } else {
    document.getElementById('auth').hidden = false;
    document.getElementById('app').hidden = true;
    setTimeout(() => document.getElementById('pw-input').focus(), 100);
  }
}
function showApp() {
  document.getElementById('auth').hidden = true;
  document.getElementById('app').hidden = false;
  loadData();
}
document.getElementById('pw-btn').addEventListener('click', tryAuth);
document.getElementById('pw-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') tryAuth();
});
function tryAuth() {
  const v = document.getElementById('pw-input').value;
  if (v === PASSWORD) {
    sessionStorage.setItem('qm_auth', '1');
    showApp();
  } else {
    document.getElementById('pw-err').hidden = false;
    document.getElementById('pw-input').value = '';
    document.getElementById('pw-input').focus();
  }
}

/* ============================================================
   CSV parser (BOM/quoted-comma 처리)
   ============================================================ */
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const lines = text.split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const cells = parseLine(lines[i]);
    if (cells.length === 1 && !cells[0]) continue;
    const r = {};
    headers.forEach((h, j) => { r[h] = cells[j] !== undefined ? cells[j] : ''; });
    rows.push(r);
  }
  return { headers, rows };
}
function parseLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const NUM_FIELDS = [
  '현재가','시가총액','Recent_Volume','PER','PBR','ROE','업종평균PER',
  'Forward_PER','PEG','거래량배수','RSI','저항선','지지선','평균거래량_20d',
  '외인_5d','외인_20d','기관_5d','기관_20d',
  '매출액_2023','매출액_2024','매출액_2025','매출액_2026','매출액_2027','매출액_2028',
  '영업이익_2023','영업이익_2024','영업이익_2025','영업이익_2026','영업이익_2027','영업이익_2028',
  '매출액_성장률_2025','매출액_성장률_2026','매출액_성장률_2027','매출액_성장률_2028',
  '영업이익_성장률_2025','영업이익_성장률_2026','영업이익_성장률_2027','영업이익_성장률_2028',
  '매출액_최대성장률','영업이익_최대성장률','종합성장점수',
];
function normalize(rows) {
  return rows.map(row => {
    NUM_FIELDS.forEach(f => {
      const v = row[f];
      const n = (v === '' || v === undefined || v === 'nan' || v === 'NaN') ? NaN : parseFloat(v);
      row[f] = n;
    });
    return row;
  });
}

/* ============================================================
   데이터 로드 + 캐시
   ============================================================ */
async function loadData() {
  const list = document.getElementById('card-list');
  list.innerHTML = '<div class="loading">📡 데이터 로딩 중...</div>';

  // 캐시 시도
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && Date.now() - obj.ts < CACHE_TTL_MS) {
        allData = obj.data;
        renderMeta(obj.ts);
        applyFilters();
        // 백그라운드 새로고침
        fetchFresh().catch(() => {});
        return;
      }
    }
  } catch (e) {}

  await fetchFresh();
}

async function fetchFresh() {
  try {
    const res = await fetch(CSV_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const { rows } = parseCSV(text);
    allData = normalize(rows);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: allData }));
    } catch (e) { /* 용량 초과 무시 */ }
    renderMeta(Date.now());
    applyFilters();
  } catch (e) {
    if (allData.length === 0) {
      document.getElementById('card-list').innerHTML =
        '<div class="error">⚠ 데이터 로드 실패: ' + e.message + '<br>네트워크 또는 레포 권한을 확인하세요.</div>';
    }
  }
}

function renderMeta(ts) {
  const d = new Date(ts);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  document.getElementById('meta-bar').innerHTML =
    `<span>업데이트 ${dateStr}</span>` +
    `<span class="count" id="meta-count">${filteredData.length || 0}건</span>`;
}

/* ============================================================
   필터 + 정렬
   ============================================================ */
function applyFilters() {
  const f = filters;
  filteredData = allData.filter(row => {
    if (!f.markets.includes(row['시장'])) return false;
    const vol = +row['Recent_Volume'] || 0;
    if (vol < f.minVol) return false;

    // 영업이익 26~28 최대값으로 규모 필터
    const op26vals = [row['영업이익_2026'], row['영업이익_2027'], row['영업이익_2028']]
                       .filter(v => !isNaN(v));
    const op26max = op26vals.length ? Math.max(...op26vals) : NaN;
    if (f.opSize === '300이하') {
      if (isNaN(op26max) || op26max > 300) return false;
    } else if (f.opSize === '500-1000') {
      if (isNaN(op26max) || op26max < 500 || op26max > 1000) return false;
    } else if (f.opSize === '1000+') {
      if (isNaN(op26max) || op26max < 1000) return false;
    }

    // 엄격한 재무 필터 (매출 500↑, 영업이익 흑자, 매출 초과 적자 제외) — 데스크톱 디폴트와 동일
    for (const y of [2023, 2024, 2025, 2026, 2027, 2028]) {
      const rv = row[`매출액_${y}`];
      const ov = row[`영업이익_${y}`];
      if (!isNaN(rv) && rv < 500) return false;
      if (!isNaN(ov) && ov < 0) return false;
      if (!isNaN(ov) && !isNaN(rv) && ov < 0 && Math.abs(ov) > rv) return false;
    }

    // 성장률 임계값 (어느 한 해라도 충족)
    const revG = [2025,2026,2027,2028].map(y => row[`매출액_성장률_${y}`]).filter(v => !isNaN(v));
    const opG  = [2025,2026,2027,2028].map(y => row[`영업이익_성장률_${y}`]).filter(v => !isNaN(v));
    const meets = revG.some(v => v >= f.revThresh) || opG.some(v => v >= f.opThresh);
    if (!meets) return false;

    // 검색
    if (f.search) {
      const q = f.search.toLowerCase();
      const name = (row['종목명'] || '').toLowerCase();
      const code = String(row['종목코드'] || '');
      if (!name.includes(q) && !code.includes(q)) return false;
    }
    return true;
  });

  // 정렬용 보조 계산
  filteredData.forEach(r => {
    r.__visibility = visibilityScore(r);
    r.__op26max = (() => {
      const v = [r['영업이익_2026'], r['영업이익_2027'], r['영업이익_2028']].filter(x => !isNaN(x));
      return v.length ? Math.max(...v) : NaN;
    })();
  });

  sortFiltered();
  page = 1;
  render();
  const c = document.getElementById('meta-count');
  if (c) c.textContent = `${filteredData.length}건`;
}

function visibilityScore(r) {
  const rv24 = r['매출액_2024'], rv25 = r['매출액_2025'], rv26 = r['매출액_2026'],
        rv27 = r['매출액_2027'], rv28 = r['매출액_2028'];
  let pr = 5, mt = 0;
  if (!isNaN(rv28) && !isNaN(rv25) && rv25 > 0) {
    pr = 1; mt = (Math.pow(rv28/rv25, 1/3) - 1) * 100;
  } else if (!isNaN(rv27) && !isNaN(rv25) && rv25 > 0) {
    pr = 2; mt = (Math.pow(rv27/rv25, 1/2) - 1) * 100;
  } else if (!isNaN(rv26) && !isNaN(rv25) && rv25 > 0) {
    pr = 3; mt = (rv26/rv25 - 1) * 100;
  } else if (!isNaN(rv25) && !isNaN(rv24) && rv24 > 0) {
    pr = 4; mt = (rv25/rv24 - 1) * 100;
  }
  return { pr, mt, sort: (5 - pr) * 1e8 + mt };
}

function sortFiltered() {
  const k = filters.sortKey;
  const asc = (k === 'fwd_per' || k === 'peg');
  const getV = r => {
    switch (k) {
      case 'visibility':  return r.__visibility.sort;
      case 'op26':        return r.__op26max;
      case 'score':       return r['종합성장점수'];
      case 'rev_max':     return r['매출액_최대성장률'];
      case 'op_max':      return r['영업이익_최대성장률'];
      case 'vol_ratio':   return r['거래량배수'];
      case 'fwd_per':     return r['Forward_PER'];
      case 'peg':         return r['PEG'];
      case 'mcap':        return r['시가총액'];
      default:            return 0;
    }
  };
  filteredData.sort((a, b) => {
    let av = getV(a), bv = getV(b);
    if (isNaN(av) || av === undefined) av = asc ? Infinity : -Infinity;
    if (isNaN(bv) || bv === undefined) bv = asc ? Infinity : -Infinity;
    return asc ? av - bv : bv - av;
  });
}

/* ============================================================
   포맷터
   ============================================================ */
function fmtPrice(v) {
  if (!v || isNaN(v)) return '-';
  return Math.round(v).toLocaleString() + '원';
}
function fmtVol(v) {
  if (!v || isNaN(v)) return '-';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v.toString();
}
function fmtNumK(v) {
  if (!v || isNaN(v)) return '-';
  if (Math.abs(v) >= 1_000_000) return (v / 10000).toFixed(0) + '조';
  if (Math.abs(v) >= 10000)     return (v / 10000).toFixed(0) + '조';
  return v.toLocaleString();
}
function fmtMcap(v) {
  if (!v || isNaN(v)) return '-';
  // v는 억원 단위
  if (v >= 10000)  return (v / 10000).toFixed(0) + '조';
  if (v >= 1000)   return (v / 1000).toFixed(1) + '천억';
  return v.toFixed(0) + '억';
}
function fmtTurnover(vol, price) {
  if (!vol || !price || isNaN(vol) || isNaN(price)) return '-';
  const won = vol * price;
  if (won >= 1e12) return (won / 1e12).toFixed(1) + '조';
  if (won >= 1e8)  return (won / 1e8).toFixed(0) + '억';
  if (won >= 1e4)  return (won / 1e4).toFixed(0) + '만';
  return Math.round(won).toLocaleString();
}
function fmtFlow(shares, price) {
  if (shares === undefined || shares === null || isNaN(shares) || shares === 0) return '-';
  const won = shares * (price || 0);
  const sign = shares > 0 ? '+' : '−';
  const a = Math.abs(won);
  if (a >= 1e8)  return sign + (a / 1e8).toFixed(1) + '억';
  if (a >= 1e7)  return sign + (a / 1e7).toFixed(0) + '천만';
  return sign + Math.abs(Math.round(shares)).toLocaleString() + '주';
}

/* ============================================================
   판정 (OBV + RSI + MACD)
   ============================================================ */
function obvRsiMacdVerdict(obv, rsi, macd) {
  const obvU = obv === 'up', obvD = obv === 'down';
  const rOver  = !isNaN(rsi) && rsi >= 70;
  const rUnder = !isNaN(rsi) && rsi <= 30;
  const rBull  = !isNaN(rsi) && rsi >= 50 && rsi < 70;
  const rBear  = !isNaN(rsi) && rsi > 30 && rsi < 50;
  const mGC = macd === 'bull_cross', mDC = macd === 'bear_cross';
  const mB  = macd === 'bull',       mD  = macd === 'bear';
  const mKnown = (mGC || mDC || mB || mD);
  if (!obv && isNaN(rsi) && !macd)
    return { name: '데이터 없음', color: '#94A3B8', icon: '·', reason: '기술 지표 미수집' };

  if (mGC && rUnder && obvU)
    return { name: '바닥 매수', color: '#10B981', icon: '🚀', reason: '골든크로스 + 과매도 + OBV 매집' };
  if (mDC && rOver && obvD)
    return { name: '고점 매도', color: '#EF4444', icon: '💀', reason: '데드크로스 + 과매수 + OBV 분산' };
  if (mGC && (rBull || rUnder) && obvU)
    return { name: '추세 확정', color: '#10B981', icon: '💎', reason: '골든크로스 + RSI 강세 + 매집' };
  if (mDC && (rBear || rOver) && obvD)
    return { name: '추세 붕괴', color: '#EF4444', icon: '🔻', reason: '데드크로스 + RSI 약세 + 분산' };
  if (mGC && obvU)
    return { name: '매수 진입', color: '#34D399', icon: '✦', reason: '골든크로스 + 매집' };
  if (mDC && obvD)
    return { name: '매도 진입', color: '#F87171', icon: '✦', reason: '데드크로스 + 분산' };
  if ((mD || mDC) && obvU)
    return { name: '강세 다이버전스', color: '#34D399', icon: '🔄', reason: 'MACD 약세 but OBV 매집' };
  if ((mB || mGC) && obvD)
    return { name: '약세 다이버전스', color: '#F59E0B', icon: '⚠', reason: 'MACD 강세 but OBV 분산' };
  if (rOver && (mB || mGC) && obvU)
    return { name: '과열 주의', color: '#F59E0B', icon: '🔥', reason: 'RSI 과매수 + MACD 강세' };
  if (rOver && (mD || mDC))
    return { name: '고점 신호', color: '#EF4444', icon: '▼', reason: 'RSI 과매수 + MACD 약세' };
  if (rUnder && (mB || mGC))
    return { name: '저평가 매수', color: '#10B981', icon: '★', reason: 'RSI 과매도 + MACD 강세' };
  if (rUnder && (mD || mDC))
    return { name: '약세 관망', color: '#94A3B8', icon: '⏳', reason: 'RSI 과매도 + MACD 약세' };
  if (rOver && !mKnown)
    return { name: '과열 경계', color: '#F59E0B', icon: '⚠', reason: 'RSI 과매수' };
  if (rUnder && !mKnown)
    return { name: '저점 경계', color: '#34D399', icon: '★', reason: 'RSI 과매도' };
  if ((mB || mGC) && rBull && obvU)
    return { name: '상승 추세', color: '#10B981', icon: '📈', reason: '3지표 모두 강세' };
  if ((mD || mDC) && rBear && obvD)
    return { name: '하락 추세', color: '#EF4444', icon: '📉', reason: '3지표 모두 약세' };

  // 점수 fallback
  const obvS = obvU ? 1 : (obvD ? -1 : 0);
  const rsiS = (rBull || rOver) ? 1 : ((rBear || rUnder) ? -1 : 0);
  const macdS = mGC ? 2 : (mB ? 1 : (mDC ? -2 : (mD ? -1 : 0)));
  const tot = obvS + rsiS + macdS;
  if (tot >=  3) return { name: '강세 우위', color: '#34D399', icon: '↗', reason: `종합 +${tot}` };
  if (tot >=  1) return { name: '매집 진행', color: '#34D399', icon: '▲', reason: `종합 +${tot}` };
  if (tot <= -3) return { name: '약세 우위', color: '#F87171', icon: '↘', reason: `종합 ${tot}` };
  if (tot <= -1) return { name: '분산 진행', color: '#EF4444', icon: '▽', reason: `종합 ${tot}` };
  return { name: '중립', color: '#62EFFF', icon: '·', reason: '특별한 시그널 없음' };
}

/* ============================================================
   SVG 라인차트 (성장률)
   ============================================================ */
function buildGrowthSVG(rev, op, labels) {
  const W = 360, H = 130;
  const pl = 30, pr = 12, pt = 22, pb = 22;
  const iw = W - pl - pr, ih = H - pt - pb;
  const all = [...rev, ...op].filter(v => !isNaN(v));
  if (!all.length) {
    return `<svg viewBox="0 0 ${W} ${H}"><text x="${W/2}" y="${H/2+4}" fill="#94A3B8" text-anchor="middle" font-size="12">성장률 데이터 없음</text></svg>`;
  }
  let mn = Math.min(...all), mx = Math.max(...all);
  if (mn > 0) mn = 0;
  if (mx < 0) mx = 0;
  if (mn === mx) { mn -= 10; mx += 10; }
  const span = (mx - mn) || 1;
  const pad = span * 0.15;
  mn -= pad; mx += pad;
  const sp = mx - mn;
  const n = labels.length;
  const X = i => pl + (iw * i) / Math.max(1, n - 1);
  const Y = v => pt + ih - ((v - mn) / sp) * ih;

  let parts = '';
  // 그리드 + 0선
  for (const fr of [0, 0.5, 1]) {
    const gy = pt + ih * fr;
    parts += `<line x1="${pl}" y1="${gy}" x2="${W - pr}" y2="${gy}" stroke="#4A5568" stroke-width="0.5" stroke-dasharray="2,3" opacity="0.55"/>`;
  }
  if (mn <= 0 && 0 <= mx) {
    const zy = Y(0);
    parts += `<line x1="${pl}" y1="${zy}" x2="${W - pr}" y2="${zy}" stroke="#94A3B8" stroke-width="0.7" stroke-dasharray="3,3" opacity="0.5"/>`;
  }

  // X 라벨
  for (let i = 0; i < n; i++) {
    parts += `<text x="${X(i)}" y="${H - 6}" fill="#94A3B8" font-size="10" text-anchor="middle" font-family="JetBrains Mono">${labels[i]}</text>`;
  }
  // Y min/max
  parts += `<text x="${pl - 4}" y="${pt + 4}" fill="#94A3B8" font-size="9" text-anchor="end" font-family="JetBrains Mono">${mx.toFixed(0)}%</text>`;
  parts += `<text x="${pl - 4}" y="${pt + ih + 3}" fill="#94A3B8" font-size="9" text-anchor="end" font-family="JetBrains Mono">${mn.toFixed(0)}%</text>`;

  function buildLine(vals, color, labelColor, above) {
    const pts = [];
    for (let i = 0; i < vals.length; i++) {
      const v = vals[i];
      if (isNaN(v)) continue;
      pts.push([X(i), Y(v), v]);
    }
    if (!pts.length) return '';
    const dy = above ? -7 : 13;
    let d = '';
    pts.forEach((p, i) => { d += (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' '; });
    let circles = '';
    let labels2 = '';
    pts.forEach(([x, y, v]) => {
      circles += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${color}" stroke="#1F2937" stroke-width="1"/>`;
      labels2 += `<text x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" fill="${labelColor}" font-size="9" font-weight="700" text-anchor="middle" font-family="JetBrains Mono" paint-order="stroke" stroke="rgba(17,24,39,0.85)" stroke-width="2">${v.toFixed(0)}%</text>`;
    });
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${circles}${labels2}`;
  }
  parts += buildLine(rev, '#34D399', '#6EE7B7', true);
  parts += buildLine(op,  '#A78BFA', '#C4B5FD', false);
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${parts}</svg>`;
}

/* ============================================================
   카드 렌더
   ============================================================ */
function render() {
  const list = document.getElementById('card-list');
  if (!filteredData.length) {
    list.innerHTML = '<div class="empty">조건에 맞는 종목이 없습니다.</div>';
    document.getElementById('pager').innerHTML = '';
    return;
  }
  const start = (page - 1) * PAGE_SIZE;
  const slice = filteredData.slice(start, start + PAGE_SIZE);
  list.innerHTML = slice.map((r, i) => renderCard(r, start + i + 1)).join('');
  renderPager();
  // 페이지 바뀌면 위로
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCard(r, rank) {
  const code   = String(r['종목코드'] || '').padStart(6, '0');
  const name   = r['종목명'] || '';
  const market = r['시장'] || '';
  const price  = r['현재가'];
  const vol    = r['Recent_Volume'];
  const mcap   = r['시가총액'];
  const score  = r['종합성장점수'];
  const avail  = r['데이터_가용성'] || '-';
  const volRatio = r['거래량배수'];
  const vis = r.__visibility || { pr: 5, mt: 0 };

  const per   = r['PER'];
  const fwd   = r['Forward_PER'];
  const sec   = r['업종평균PER'];
  const pbr   = r['PBR'];
  const peg   = r['PEG'];
  const roe   = r['ROE'];

  const obv  = r['OBV_trend'] || '';
  const rsi  = r['RSI'];
  const macd = r['MACD_signal'] || '';
  const ma   = r['MA_align'] || '';
  const res  = r['저항선'];
  const sup  = r['지지선'];

  const f5  = r['외인_5d'];
  const f20 = r['외인_20d'];
  const i5  = r['기관_5d'];
  const i20 = r['기관_20d'];

  const verdict = obvRsiMacdVerdict(obv, rsi, macd);

  // OBV / RSI / MA / MACD 라벨
  const obvMap  = { up:['매집 ↗','#34D399'], down:['분산 ↘','#F87171'], flat:['횡보 →','#94A3B8'] };
  const macdMap = { bull_cross:['골든크로스 ✦','#34D399'], bear_cross:['데드크로스 ✦','#F87171'],
                    bull:['상승 ↗','#34D399'], bear:['하락 ↘','#F87171'] };
  const maMap   = { up:['정배열 ▲','#34D399'], down:['역배열 ▽','#F87171'], mixed:['혼조 →','#94A3B8'] };
  const [obvL, obvC]   = obvMap[obv]  || ['-','#64748B'];
  const [macdL, macdC] = macdMap[macd] || ['-','#64748B'];
  const [maL, maC]     = maMap[ma]    || ['-','#64748B'];

  let rsiL = '-', rsiZone = '데이터 없음', rsiC = '#64748B';
  if (!isNaN(rsi)) {
    rsiL = rsi.toFixed(1);
    if (rsi >= 70) { rsiZone = '과매수'; rsiC = '#F87171'; }
    else if (rsi <= 30) { rsiZone = '과매도'; rsiC = '#34D399'; }
    else { rsiZone = '중립'; rsiC = '#62EFFF'; }
  }

  // 성장률 차트 ('24부터)
  const rg24 = yoy(r['매출액_2024'], r['매출액_2023']);
  const og24 = yoy(r['영업이익_2024'], r['영업이익_2023']);
  const chartSvg = buildGrowthSVG(
    [rg24, r['매출액_성장률_2025'], r['매출액_성장률_2026'], r['매출액_성장률_2027'], r['매출액_성장률_2028']],
    [og24, r['영업이익_성장률_2025'], r['영업이익_성장률_2026'], r['영업이익_성장률_2027'], r['영업이익_성장률_2028']],
    ["'24","'25E","'26E","'27E","'28E"]
  );

  // 가격 레벨
  let levelHTML = '<div class="c-level-pos" style="text-align:left;color:#64748B;">데이터 없음</div>';
  if (!isNaN(res) && !isNaN(sup) && res > sup) {
    const cur = (price && price > 0) ? price : res;
    const pos = Math.max(0, Math.min(100, (cur - sup) / (res - sup) * 100));
    let pColor = '#FBBF24', pZone = '구간 내';
    if (pos >= 80) { pColor = '#F87171'; pZone = '저항 근접'; }
    else if (pos <= 20) { pColor = '#34D399'; pZone = '지지 근접'; }
    levelHTML = `
      <div class="row"><div class="item" style="flex:1;">
        <span class="k">저항</span><span class="v" style="color:#F87171;">${Math.round(res).toLocaleString()}</span>
      </div><div class="item" style="flex:1;text-align:right;">
        <span class="k">지지</span><span class="v" style="color:#34D399;">${Math.round(sup).toLocaleString()}</span>
      </div></div>
      <div>
        <div class="c-level-bar"><div class="c-level-mark" style="left:calc(${pos.toFixed(1)}% - 1.5px);"></div></div>
        <div class="c-level-pos">현재 <b style="color:${pColor};">${Math.round(cur).toLocaleString()}</b> · <b style="color:${pColor};">${pos.toFixed(0)}%</b> (${pZone})</div>
      </div>`;
  }

  // 거래량 배수 칩
  let vrHTML = '<span style="color:#64748B;">-</span>';
  if (!isNaN(volRatio)) {
    if (volRatio >= 5)      vrHTML = `<span style="color:#FCA5A5;font-weight:800;">🔥 ${volRatio.toFixed(1)}x</span>`;
    else if (volRatio >= 2) vrHTML = `<span style="color:#FBBF24;font-weight:700;">▲ ${volRatio.toFixed(1)}x</span>`;
    else                    vrHTML = `<span style="color:#94A3B8;">${volRatio.toFixed(1)}x</span>`;
  }

  // 수급 색상
  function flowClass(s) { return isNaN(s) ? 'flow-flat' : (s > 0 ? 'flow-up' : (s < 0 ? 'flow-dn' : 'flow-flat')); }

  // pill (PEG 색)
  let pegC = '#64748B', pegStr = '-';
  if (!isNaN(peg)) {
    pegStr = peg.toFixed(2);
    pegC = peg <= 1 ? '#34D399' : (peg <= 2 ? '#FBBF24' : '#F87171');
    if (peg <= 1) pegStr = '★ ' + pegStr;
  }

  // 재무소스
  function f0(v) { return isNaN(v) ? '-' : Math.round(v).toLocaleString(); }
  const evidence = `
    <table>
      <thead><tr>
        <th>(억원)</th><th>'23</th><th>'24</th>
        <th class="est">'25E</th><th class="est">'26E</th>
        <th class="est">'27E</th><th class="est">'28E</th>
      </tr></thead>
      <tbody>
        <tr><td>매출액</td>
          <td>${f0(r['매출액_2023'])}</td><td>${f0(r['매출액_2024'])}</td>
          <td class="est-cell">${f0(r['매출액_2025'])}</td>
          <td class="est-cell">${f0(r['매출액_2026'])}</td>
          <td class="est-cell">${f0(r['매출액_2027'])}</td>
          <td class="est-cell">${f0(r['매출액_2028'])}</td></tr>
        <tr><td>영업이익</td>
          <td>${f0(r['영업이익_2023'])}</td><td>${f0(r['영업이익_2024'])}</td>
          <td class="est-cell">${f0(r['영업이익_2025'])}</td>
          <td class="est-cell">${f0(r['영업이익_2026'])}</td>
          <td class="est-cell">${f0(r['영업이익_2027'])}</td>
          <td class="est-cell">${f0(r['영업이익_2028'])}</td></tr>
      </tbody>
    </table>`;

  const naverUrl = `https://m.stock.naver.com/domestic/stock/${code}/total`;

  return `
  <article class="card">
    <div class="c-head">
      <span class="c-rank">#${rank}</span>
      <span class="c-badge ${market === 'KOSPI' ? 'kospi' : 'kosdaq'}">${market}</span>
      <span class="c-name">${escapeHtml(name)}</span>
      <span class="c-code">${code}</span>
    </div>

    <div class="c-price-row">
      <div>
        <span class="c-price-label">현재가</span>
        <span class="c-price">${fmtPrice(price)}</span>
      </div>
      <div class="c-pill-score">
        <div class="l">종합점수 (가시성 P${vis.pr})</div>
        <div class="v">${score >= 500 ? '⭐ ' : ''}${isNaN(score) ? '-' : Math.round(score).toLocaleString()}</div>
      </div>
    </div>

    <div class="c-stats">
      <div class="c-stat"><span class="k">거래량 / 거래대금</span>
        <span class="v">${fmtVol(vol)} / ${fmtTurnover(vol, price)}</span>
        <span class="v-sub">${vrHTML}</span></div>
      <div class="c-stat"><span class="k">시가총액</span>
        <span class="v">${fmtMcap(mcap)}</span></div>
      <div class="c-stat"><span class="k">외인 5d / 20d</span>
        <span class="v ${flowClass(f5)}">${fmtFlow(f5, price)}</span>
        <span class="v-sub">${fmtFlow(f20, price)}</span></div>
      <div class="c-stat"><span class="k">기관 5d / 20d</span>
        <span class="v ${flowClass(i5)}">${fmtFlow(i5, price)}</span>
        <span class="v-sub">${fmtFlow(i20, price)}</span></div>
    </div>

    <div class="c-pills">
      <div class="c-pill"><div class="l">PER (TTM)</div><div class="v">${isNaN(per) ? '-' : per.toFixed(1)}</div></div>
      <div class="c-pill hi"><div class="l">Fwd PER</div><div class="v">${isNaN(fwd) ? '-' : fwd.toFixed(1)}</div></div>
      <div class="c-pill"><div class="l">업종 PER</div><div class="v">${isNaN(sec) ? '-' : sec.toFixed(1)}</div></div>
      <div class="c-pill"><div class="l">PBR</div><div class="v">${isNaN(pbr) ? '-' : pbr.toFixed(2)}</div></div>
      <div class="c-pill"><div class="l">PEG</div><div class="v" style="color:${pegC};">${pegStr}</div></div>
      <div class="c-pill hi"><div class="l">ROE</div><div class="v">${isNaN(roe) ? '-' : roe.toFixed(1) + '%'}</div></div>
    </div>

    <div class="c-chart">
      <div class="c-chart-legend">
        <span><span class="dot" style="background:#34D399;"></span>매출 성장률</span>
        <span><span class="dot" style="background:#A78BFA;"></span>영업이익 성장률</span>
      </div>
      ${chartSvg}
    </div>

    <div class="c-tech">
      <div class="label">📡 보조지표 분석</div>
      <div class="row">
        <div class="item" style="flex:1 1 50%;"><span class="k">OBV</span><span class="v" style="color:${obvC};">${obvL}</span></div>
        <div class="item" style="flex:1 1 50%;"><span class="k">RSI(14)</span><span class="v" style="color:${rsiC};">${rsiL} <span class="v-sub" style="color:#94A3B8;">(${rsiZone})</span></span></div>
        <div class="item" style="flex:1 1 50%;"><span class="k">이평 (5/20/60)</span><span class="v" style="color:${maC};">${maL}</span></div>
        <div class="item" style="flex:1 1 50%;"><span class="k">MACD (12/26/9)</span><span class="v" style="color:${macdC};">${macdL}</span></div>
      </div>

      <div class="label" style="margin-top:4px;">📊 60일 가격 레벨</div>
      ${levelHTML}

      <div class="verdict-line">
        <div class="vt">
          <span class="label">종합 판정</span>
          <span class="vname" style="color:${verdict.color};">${verdict.icon} ${verdict.name}</span>
        </div>
        <div class="reason">↳ ${verdict.reason}</div>
      </div>
    </div>

    <div class="c-evidence">
      <div class="head">재무 소스 (단위: 억원)</div>
      ${evidence}
    </div>

    <a class="c-link" href="${naverUrl}" target="_blank" rel="noopener">📱 네이버 모바일 종목 →</a>
  </article>`;
}

function yoy(curr, base) {
  if (isNaN(curr) || isNaN(base) || base === 0) return NaN;
  return (curr - base) / Math.abs(base) * 100;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ============================================================
   페이저
   ============================================================ */
function renderPager() {
  const total = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pg = document.getElementById('pager');
  pg.innerHTML = `
    <button id="pg-prev" ${page <= 1 ? 'disabled' : ''}>◀ 이전</button>
    <span class="info">${page} / ${total}</span>
    <button id="pg-next" ${page >= total ? 'disabled' : ''}>다음 ▶</button>
  `;
  const prev = document.getElementById('pg-prev');
  const next = document.getElementById('pg-next');
  if (prev) prev.addEventListener('click', () => { page--; render(); });
  if (next) next.addEventListener('click', () => { page++; render(); });
}

/* ============================================================
   드로어 (필터)
   ============================================================ */
const drawer = document.getElementById('drawer');
const drawerBg = document.getElementById('drawer-bg');
function openDrawer() {
  // 현재 필터 값 → UI 반영
  document.querySelectorAll('[data-group="market"] .chip').forEach(c => {
    c.classList.toggle('active', filters.markets.includes(c.dataset.val));
  });
  document.querySelectorAll('[data-group="opsize"] .chip').forEach(c => {
    c.classList.toggle('active', c.dataset.val === filters.opSize);
  });
  document.getElementById('rev-thresh').value = filters.revThresh;
  document.getElementById('op-thresh').value = filters.opThresh;
  document.getElementById('rev-val').textContent = filters.revThresh;
  document.getElementById('op-val').textContent = filters.opThresh;
  document.getElementById('min-vol').value = filters.minVol;
  document.getElementById('sort-key').value = filters.sortKey;

  drawer.hidden = false;
  drawerBg.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  drawer.hidden = true;
  drawerBg.hidden = true;
  document.body.style.overflow = '';
}
document.getElementById('filter-btn').addEventListener('click', openDrawer);
document.getElementById('drawer-close').addEventListener('click', closeDrawer);
drawerBg.addEventListener('click', closeDrawer);

document.getElementById('rev-thresh').addEventListener('input', e => {
  document.getElementById('rev-val').textContent = e.target.value;
});
document.getElementById('op-thresh').addEventListener('input', e => {
  document.getElementById('op-val').textContent = e.target.value;
});

// 단일 선택 chip
document.querySelectorAll('[data-group="opsize"] .chip').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('[data-group="opsize"] .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
  });
});
// 다중 토글 chip
document.querySelectorAll('[data-group="market"] .chip').forEach(c => {
  c.addEventListener('click', () => c.classList.toggle('active'));
});

document.getElementById('apply-btn').addEventListener('click', () => {
  const markets = [];
  document.querySelectorAll('[data-group="market"] .chip.active').forEach(c => markets.push(c.dataset.val));
  if (markets.length === 0) markets.push('KOSPI', 'KOSDAQ');   // 최소 하나 보장
  filters.markets = markets;
  filters.revThresh = +document.getElementById('rev-thresh').value;
  filters.opThresh = +document.getElementById('op-thresh').value;
  filters.minVol = +document.getElementById('min-vol').value;
  filters.sortKey = document.getElementById('sort-key').value;
  const opSizeEl = document.querySelector('[data-group="opsize"] .chip.active');
  if (opSizeEl) filters.opSize = opSizeEl.dataset.val;
  closeDrawer();
  applyFilters();
});

/* ============================================================
   검색 바
   ============================================================ */
document.getElementById('search-toggle').addEventListener('click', () => {
  const sb = document.getElementById('search-bar');
  sb.hidden = !sb.hidden;
  if (!sb.hidden) {
    document.getElementById('search-input').focus();
  }
});
let searchTimer = null;
document.getElementById('search-input').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    filters.search = e.target.value.trim();
    page = 1;
    applyFilters();
  }, 200);
});

/* ============================================================
   시작
   ============================================================ */
checkAuth();
