# 퀀트 모바일 (ai2-mobile)

`ai2` 데스크톱 스크리너의 **모바일 전용 뷰어**.
- 크롤링 X — `ai2` 레포의 자동 크롤 결과(`data/consensus_data.csv`)를 raw URL로 직접 읽음
- Streamlit X — 순수 HTML/CSS/JS 정적 페이지 (GitHub Pages에 그대로 배포)
- 비밀번호 게이트 (sessionStorage)
- 30분 LocalStorage 캐시 (모바일 데이터 절약)

## 구성
```
ai2-mobile/
├── index.html    # 잠금 화면 + 메인 앱 + 필터 드로어
├── styles.css    # 다크 테마, 모바일 우선 CSS
├── app.js        # CSV fetch · 필터 · 정렬 · 카드 렌더 · SVG 차트
└── README.md
```

## 데이터 소스
- `https://raw.githubusercontent.com/perseus2133-ai/ai2/main/data/consensus_data.csv`
- 매일 새벽 GitHub Actions가 자동 크롤 → 모바일은 그 결과만 본다

## 카드 표시 항목
- 헤더: 랭크 · 시장(KOSPI/KOSDAQ) · 종목명 · 코드
- 가격 라인: 현재가, 종합점수(가시성 P등급)
- 미니 스탯 (2×2): 거래량/거래대금, 시가총액, 외인 5d/20d, 기관 5d/20d
- 가로 스크롤 pill: PER · Forward PER · 업종 PER · PBR · PEG · ROE
- 성장률 라인차트 SVG: '24~'28E 매출/영업이익
- 보조지표 분석: OBV / RSI(14) / 이평(5/20/60) / MACD(12/26/9)
- 60일 가격 레벨: 저항/지지선 + 그라데이션 바 + 현재가 위치 %
- 종합 판정: OBV+RSI+MACD 3종 6단계 매트릭스
- 재무 소스 표: 매출/영업이익 '23~'28E
- 네이버 모바일 종목 페이지 링크

## 필터 (드로어)
- 시장 (KOSPI/KOSDAQ multi-toggle chip)
- 매출/영업이익 성장률 임계값 (range slider)
- 영업이익 규모 (300이하 / 500-1000 / 1000+)
- 최소 거래량
- 정렬: 가시성 / 26+ 영업이익 / 점수 / 성장률 / Fwd PER / PEG / 시총

## 배포 (GitHub Pages)
1. 이 레포의 Settings → Pages → Source: `main` branch / `/ (root)`
2. 1~2분 후 `https://perseus2133-ai.github.io/ai2-mobile/` 에서 접근
3. 모바일 사파리/크롬 → "홈 화면에 추가" 시 PWA처럼 동작

## 비밀번호
- 코드 안에 평문 (`9084`) — 데스크톱 버전과 동일 수준
- 진짜 보안이 필요하면 Cloudflare Workers 등으로 게이트 별도 구성 권장

## 개발/디버깅
정적 페이지라 어떤 정적 서버라도 OK:
```bash
# Python
python -m http.server 8000

# Node
npx serve .
```
브라우저 → `http://localhost:8000`
