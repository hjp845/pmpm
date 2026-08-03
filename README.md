# 🧸 모아모아

**내 모든 프로젝트를 한눈에** — 여러 비즈니스와 사이드 프로젝트를 귀엽고 전문적으로 관리하는 대시보드.

🔗 **Live**: https://pmpm-eta.vercel.app

## 기능

- 🏠 **대시보드** — KPI 타일(프로젝트 수·진행중·완료율·마감 임박), 상태 분포 도넛 차트, 최근 7일 완료 추이, 다가오는 마감, 활동 피드
- 📁 **프로젝트** — 이모지·테마 컬러·태그·마감일 설정, 상태 관리(계획/진행/보류/완료), 핀 고정, 검색·필터·정렬, 할 일 기반 자동 진행률
- 📋 **칸반보드** — 드래그앤드롭으로 상태 이동(낙관적 업데이트), 우선순위·D-day 뱃지, 프로젝트별 필터, 더블클릭 수정
- 🗓️ **캘린더** — 월간 뷰에 할 일·프로젝트 마감 표시, 날짜별 상세 패널
- 📝 **메모** — 스티키 노트 스타일, 색상 선택, 프로젝트 연결, 더블클릭 인라인 수정
- 🪄 **Ctrl+K 명령 팔레트** — 페이지·프로젝트 즉시 이동
- 🌙 **다크모드**, 토스트 알림, 마이크로 인터랙션, 모바일 하단 네비게이션

## 기술 스택

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) — 커스텀 디자인 토큰
- [Neon](https://neon.tech) Serverless Postgres (Vercel Marketplace 통합)
- [SWR](https://swr.vercel.app) — 데이터 페칭·낙관적 업데이트
- Vercel 배포 (GitHub 연동 자동 배포)

## 개발

```bash
npm install
vercel env pull .env.local   # DATABASE_URL 받기
node scripts/init-db.mjs     # 테이블 생성 + 샘플 데이터 (최초 1회)
npm run dev
```

## 구조

```
app/
  page.tsx            # 대시보드
  projects/ board/ calendar/ notes/
  api/                # projects · tasks · notes · activities CRUD
components/           # Sidebar, 차트, 모달, 토스트, 명령 팔레트 …
lib/                  # Neon 클라이언트, SWR 훅, 타입
scripts/init-db.mjs   # DB 스키마 + 시드
```
