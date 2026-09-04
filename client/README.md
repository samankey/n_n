# n_n — Client

익명 게시판 **n_n** 의 프론트엔드입니다.
프로젝트의 배경과 결론은 [루트 README](../README.md) 를 참고하세요.

## Tech Stack

- **Framework**: React 19 (Vite 8)
- **Server State**: TanStack Query v5
- **Form**: React Hook Form + Zod
- **HTTP**: Axios
- **Styling**: Tailwind CSS v4
- **Lint/Format**: Biome

## 구조

```
src/
├── api/issue-service.ts     서버 호출 (생성 / 목록 / 삭제)
├── hooks/use-posts.ts       useQuery + useMutation, 낙관적 업데이트
├── components/
│   ├── main-content.tsx     화면 조립, 모달 상태
│   ├── post-form.tsx        Zod 스키마 검증이 붙은 글쓰기 폼
│   ├── post-card.tsx        게시글 한 건
│   ├── delete-modal.tsx     삭제 시 비밀번호 확인
│   └── error-boundary.tsx   렌더 예외 격리
├── constants/messages.ts    성공 메시지 모음
└── types/index.ts           PostRecord
```

## 눈여겨볼 부분

### 낙관적 업데이트 ([`use-posts.ts`](src/hooks/use-posts.ts))

글을 쓰면 서버 응답을 기다리지 않고 목록에 먼저 그립니다.
`onMutate` 에서 진행 중인 쿼리를 취소하고 이전 캐시를 스냅샷으로 잡아둔 뒤,
실패하면 `onError` 에서 되돌리고 `onSettled` 에서 무효화합니다.

GitHub 목록 API 의 인덱싱 지연 때문에 낙관적 업데이트만으로는 부족했고,
서버 쪽에서 목록의 원천을 바꿔야 했습니다. 자세한 내용은 루트 README 의
'인덱싱 지연' 절에 있습니다.

### 작업별 로딩 상태

`isFetching` / `isAdding` / `isRemoving` 을 뮤테이션별로 분리해서 내려보내
게시 버튼과 삭제 버튼이 서로의 로딩에 영향받지 않게 했습니다.

### 스키마 기반 검증 ([`post-form.tsx`](src/components/post-form.tsx))

제목 2–20자, 내용 5–2000자, 비밀번호 4–20자를 Zod 스키마로 정의하고
`zodResolver` 로 React Hook Form 에 연결했습니다.

## 실행

```bash
npm install
npm run dev
```

서버가 `http://localhost:8000` 에 떠 있어야 합니다.
다른 주소를 쓰려면 `VITE_API_BASE_URL` 을 설정하세요.

## 미구현

- 수정 UI (서버에는 `PATCH /update_issue` 가 있습니다)
- 페이지네이션 / 무한 스크롤 — 목록은 최근 10개까지만 옵니다
- 테스트
- `alert()` 대신 토스트
