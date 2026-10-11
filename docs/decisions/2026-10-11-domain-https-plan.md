# 도메인 · HTTPS 공개 계획 — 2026-10-11

## 0. 현재
- 서버(badakaya)는 집 공유기 뒤 Wi-Fi (`172.30.1.5`, 공인 IP `121.128.146.167` — 유동일 수 있음)
- 프론트는 tailnet IP `100.125.79.96:3300` 에만 바인딩 → 외부 접근 불가. 80/443 열린 것 없음
- 백엔드·DB 는 도커 내부망. 외부로 나가는 입구는 프론트 하나 (`/api/proxy` → backend)

## 1. 방식 비교 → **추천: Cloudflare Tunnel**
| | A. Cloudflare Tunnel (추천) | B. 공유기 포트포워딩 + Caddy | C. Tailscale Funnel |
|---|---|---|---|
| 공유기 설정 | 없음 (서버가 바깥으로 연결) | 80/443 포워딩 필요 | 없음 |
| 집 IP 노출 | 숨김 | 노출 | 숨김 |
| 유동 IP | 상관없음 | DDNS 필요 | 상관없음 |
| HTTPS 인증서 | Cloudflare 가 자동 | Caddy 가 Let's Encrypt 자동 | 자동 |
| 내 도메인 | 가능 (DNS 를 Cloudflare 로) | 가능 | **불가** (`*.ts.net` 만) |
| 추가 보호 | DDoS 완화·캐시, `/admin` 에 Cloudflare Access(이메일 인증) | 직접 | 없음 |
| 비용 | 무료 | 무료 | 무료 |

B 는 통신사가 80 을 막는 경우가 있고 집 IP 가 드러남. C 는 도메인을 못 씀. → **A**.

## 2. 사용자가 할 일
1. 도메인 구입 (예: `sool.kr`, `우리술.한국` 등 — 가비아·Cloudflare Registrar)
2. Cloudflare 무료 계정 → 사이트 추가 → 도메인 등록처에서 **네임서버를 Cloudflare 로 변경** (반영 수 분~하루)
3. Cloudflare Zero Trust → Networks → Tunnels → `sool` 터널 생성 → **토큰** 복사 → 서버 `.env` 에 `CLOUDFLARE_TUNNEL_TOKEN=...` (대화에 붙이지 말 것)
4. 터널의 Public Hostname: `<도메인>` → `http://frontend:3000`

## 3. Claude 가 할 일 (도메인·토큰 준비되면 1세션)
| # | 작업 | 메모 |
|---|---|---|
| 1 | `docker-compose.yml` 에 `cloudflared` 서비스 (profile `public`) | `cloudflare/cloudflared` 버전 고정, `tunnel run --token ${CLOUDFLARE_TUNNEL_TOKEN}`, 프론트와 같은 네트워크. 프론트 포트는 지금처럼 tailnet 에만 |
| 2 | `.env`: `COOKIE_SECURE=true` | HTTPS 에서만 로그인 쿠키 전송. tailnet(http) 로그인은 안 되므로 관리자는 도메인으로 접속 |
| 3 | 백엔드 CORS 에 도메인 추가 | 프록시 경유(같은 출처)라 필수는 아니지만 정리 |
| 4 | 호출 제한 IP 확인 | Cloudflare 가 X-Forwarded-For 에 실제 IP 를 붙이므로 지금 프록시(가장 오른쪽 값)로 동작. 공개 후 로그로 확인 |
| 5 | `/admin*`·`/api/proxy/pipeline*` 에 Cloudflare Access | 관리자 비밀번호 + 이메일 인증 2중 |
| 6 | 메타데이터 (로드맵 1-5) | 제목 "SOOL — Premium Traditional Spirits" → B2B 문구, 설명·OG 이미지, `metadataBase` 를 도메인으로 |
| 7 | `robots.txt` | 리포트·관리자 경로는 색인 제외 여부 결정 |
| 8 | 확인 | 외부 망(휴대폰 LTE)에서 접속, HTTPS, 429, 허브 계약 4개 |

## 4. 공개 범위
- **전체 공개** (권장): 첫 화면·술 탐색·양조장 지도·진단 리포트·식당 도구·원료 시세. 모두 `analytics_*` 읽기 + 호출 제한
- 관리자(`/admin`)는 공개 주소에서도 열리지만 로그인(require_admin) + Cloudflare Access 로 막음
- 소비자 기능(시음 노트·커뮤니티)은 '더보기'에 접힌 그대로

## 5. 공개 전 체크리스트 (막는 조건)
- [ ] 관리자 비밀번호 변경 — **2026-10-11 확인: 아직 `admin1234`** (명령: `docs/worklog/2026-10-10.md` 6장)
- [ ] 공공데이터 인증키 재발급 → 서버 `.env` `DATA_GO_KR_SERVICE_KEY` 교체 (맥15 도 동일)
- [x] 공개 API 호출 제한 (2026-10-11, `backend/app/core/ratelimit.py`)
- [ ] 메뉴판 QR 은 공개 주소로 접속해서 다시 인쇄 (QR 은 접속한 주소를 그대로 씀)
