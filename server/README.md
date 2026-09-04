# n_n — Server

익명 게시판 **n_n** 의 백엔드입니다.
이 서버가 왜 생겼는지는 [루트 README](../README.md) 에 정리해 두었습니다.
요약하면 클라이언트만으로는 (1) 저장소 쓰기 토큰을 숨길 수 없고
(2) 비밀번호를 검증할 수 없고 (3) 요청자 IP 를 알 수 없기 때문입니다.

## Tech Stack

- **Framework**: FastAPI
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **DB**: SQLite
- **HTTP Client**: httpx (비동기)
- **Password Hashing**: bcrypt

## 역할 분리

| 모듈 | 책임 |
|---|---|
| `main.py` | 라우팅과 흐름 제어 |
| `security.py` | 비밀번호 해싱·검증, 표시용 ID 발급, IP 해싱 |
| `github_client.py` | GitHub Issues API 비동기 클라이언트 |
| `models.py` | `PostMetadata` 테이블 정의 |
| `schemas.py` | 요청 본문 검증 (Pydantic) |
| `database.py` | 엔진과 세션 |
| `config.py` | 환경변수 로딩 및 누락 시 즉시 실패 |

## 데이터 분리

본문은 GitHub Issues 에, 공개되면 안 되는 값만 로컬 DB 에 둡니다.

`PostMetadata`:

| Column | Type | 설명 |
|---|---|---|
| `id` | INTEGER PK | |
| `issue_number` | INTEGER, index + **unique** | GitHub 이슈 번호. 권한 검증이 볼 행을 확정하려고 unique |
| `author_id` | VARCHAR | 화면에 노출되는 표시용 난수 ID. 비밀번호와 무관 |
| `password_hash` | VARCHAR | bcrypt 해시. 수정·삭제 권한 검증용 |
| `ip_hash` | VARCHAR | 도배 방지용 요청자 식별값 (당일 한정) |
| `is_deleted` | BOOLEAN | 로컬 숨김 여부 |
| `created_at` | DATETIME | |

## API

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/posts` | 최근 게시글 목록. 인덱싱 지연을 단일 이슈 조회로 보정 |
| `POST` | `/post_issue` | 이슈 생성 + 메타데이터 기록. `author_id` 반환 |
| `PATCH` | `/update_issue/{n}` | 비밀번호 검증 후 제목·본문 수정 |
| `POST` | `/delete_issue/{n}` | 비밀번호 검증 후 이슈를 `closed` 로 전환 |

`/docs` 에서 스키마를 확인할 수 있습니다.

## 비밀번호 검증

`bcrypt.hashpw` 로 저장하고 `bcrypt.checkpw` 로 대조합니다.
레코드마다 솔트가 다르고 work factor 를 조절할 수 있습니다.

초기 구현은 `sha256(password).hexdigest()[:8]` 이었는데 두 가지가 문제였습니다.

- 솔트가 없어 흔한 비밀번호는 즉시 역산됩니다 — `sha256("1234")[:8] == 03ac6742`
- 32비트로 절단해서, 충돌하는 다른 비밀번호로도 남의 글을 지울 수 있습니다

게다가 이 값을 그대로 `author_id` 로 내려보내 화면에 노출하고 있었습니다.
지금은 표시용 ID 를 `secrets.token_hex(4)` 로 따로 발급합니다.

## 실행

```bash
cat > .env <<'ENV'
GITHUB_TOKEN=<repo 쓰기 권한 토큰>
REPO_OWNER=<저장소 소유자>
REPO_NAME=<이슈를 쌓을 저장소>
SECRET_SALT=<IP 해싱용 임의 문자열>
ENV

python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

`SQL_ECHO=true` 를 주면 SQL 이 출력됩니다.
SQLite 파일은 기동 시 `init_db()` 가 만들며 저장소에 커밋하지 않습니다.

## 한계

- **`ip_hash` 로 rate limiting 을 하지 않습니다.** 저장만 합니다
- **익명성이 완전하지 않습니다.** `ip_hash` 가 게시글과 같은 행에 있어,
  `SECRET_SALT` 를 아는 쪽이라면 IP 후보를 대입해 좁힐 수 있습니다
- `request.client.host` 는 프록시 뒤에서 프록시 IP 를 가리킵니다
- 목록이 `RECENT_POSTS_LIMIT`(10) 까지만 나옵니다
- 스키마 변경 시 마이그레이션 도구가 없습니다 (`create_all` 만 사용)
- 테스트가 없고 CI 는 Python 을 검사하지 않습니다
