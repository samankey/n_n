from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from contextlib import asynccontextmanager

import httpx

from database import init_db, get_session
from models import PostMetadata
from schemas import PostIssueRequest, UpdateIssueRequest, DeleteRequest
from security import hash_ip, hash_password, new_author_id, verify_password
from github_client import (
    GITHUB_API_URL,
    GITHUB_TOKEN,
    create_github_issue,
    list_github_issues,
    update_github_issue,
)

# 목록에 실어 보낼 최근 게시글 수.
# [한계] 목록은 로컬 메타 DB를 원천으로 삼기 때문에, 이 값보다 오래된
# 글은 GitHub 이슈로 남아 있어도 목록에 나오지 않는다. 커서 기반
# 페이지네이션이 필요하며 이 검증 프로젝트의 범위를 벗어난다.
RECENT_POSTS_LIMIT = 10


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("n_n 서버가 가동됩니다. DB를 초기화합니다.")
    init_db()
    yield
    print("서버를 종료합니다. 리소스를 정리합니다.")


app = FastAPI(lifespan=lifespan, title="n_n (no_name)")

app.add_middleware(
    CORSMiddleware,
    # 클라이언트 개발 서버가 쓰는 두 포트만 허용한다.
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_metadata(db: Session, issue_number: int) -> PostMetadata:
    """이슈 번호로 메타데이터를 찾는다. 없으면 404."""
    statement = select(PostMetadata).where(PostMetadata.issue_number == issue_number)
    metadata = db.exec(statement).first()
    if not metadata:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")
    return metadata


@app.get("/")
def read_root():
    return {"message": "Welcome to the n_n server"}


@app.post("/post_issue")
async def create_issue(
    issue: PostIssueRequest,
    request: Request,
    db: Session = Depends(get_session),
):
    """본문은 GitHub 이슈로, 권한 검증용 값은 로컬 DB로 나눠 저장한다."""
    response = await create_github_issue(
        issue.title, issue.content, labels=["anonymous-post"]
    )
    if response.status_code != 201:
        raise HTTPException(status_code=response.status_code, detail="기록 실패")

    issue_data = response.json()
    author_id = new_author_id()

    db.add(
        PostMetadata(
            issue_number=issue_data["number"],
            author_id=author_id,
            password_hash=hash_password(issue.password),
            ip_hash=hash_ip(request.client.host),
        )
    )
    db.commit()

    return {"message": "익명 장부에 기록되었습니다.", "author_id": author_id}


@app.get("/posts")
async def list_posts(db: Session = Depends(get_session)):
    """게시글 목록을 반환한다.

    GitHub 목록(Search) API는 이슈를 만든 직후 바로 반영되지 않아서,
    글을 쓰고 새로고침하면 방금 쓴 글이 사라져 보였다. 그래서 목록의
    원천을 로컬 메타 DB로 두고, GitHub 목록 응답에 없는 이슈만 단일
    이슈 API로 따로 조회한다. 단일 조회는 인덱싱과 무관하게 즉시
    반영된다.
    """
    try:
        issues = await list_github_issues()
        issue_dict = {i.get("number"): i for i in issues}

        statement = (
            select(PostMetadata)
            .where(PostMetadata.is_deleted == False)  # noqa: E712 (SQLModel 표현식)
            .order_by(PostMetadata.id.desc())
            .limit(RECENT_POSTS_LIMIT)
        )
        recent_metas = db.exec(statement).all()

        results = []
        async with httpx.AsyncClient(follow_redirects=True) as client:
            for meta in recent_metas:
                num = meta.issue_number

                # 목록 응답에 이미 있으면 그대로 쓴다.
                if num in issue_dict:
                    target_issue = issue_dict[num]
                # 없으면 인덱싱 지연이므로 단일 조회로 메꾼다.
                else:
                    resp = await client.get(
                        f"{GITHUB_API_URL}/{num}",
                        headers={
                            "Authorization": f"token {GITHUB_TOKEN}",
                            "Accept": "application/vnd.github.v3+json",
                        },
                    )
                    if resp.status_code != 200:
                        continue
                    target_issue = resp.json()
                    if target_issue.get("state") != "open":
                        continue

                results.append(
                    {
                        "id": num,
                        "title": target_issue.get("title"),
                        "content": target_issue.get("body"),
                        "author_id": meta.author_id,
                    }
                )

        return results
    except Exception as exc:
        # 내부 예외 메시지를 그대로 내려보내면 구현 정보가 노출된다.
        print(f"[list_posts] unexpected error: {exc!r}")
        raise HTTPException(status_code=500, detail="목록을 불러오지 못했습니다.")


@app.patch("/update_issue/{issue_number}")
async def update_issue(
    issue_number: int,
    update: UpdateIssueRequest,
    db: Session = Depends(get_session),
):
    metadata = _load_metadata(db, issue_number)

    if metadata.is_deleted:
        raise HTTPException(status_code=404, detail="이미 삭제된 기록입니다.")

    if not verify_password(update.password, metadata.password_hash):
        raise HTTPException(status_code=403, detail="비밀번호가 일치하지 않습니다.")

    payload = {}
    if update.title:
        payload["title"] = update.title
    if update.content:
        # GitHub API는 본문 키가 'body' 이므로 변환해서 넣는다.
        payload["body"] = update.content

    if not payload:
        raise HTTPException(status_code=400, detail="수정할 내용이 입력되지 않았습니다.")

    response = await update_github_issue(issue_number, payload)
    if response.status_code not in (200, 201):
        raise HTTPException(status_code=response.status_code, detail="GitHub 반영 실패")

    return {"message": "글이 성공적으로 수정되었습니다."}


@app.post("/delete_issue/{issue_number}")
async def delete_issue(
    issue_number: int,
    req: DeleteRequest,
    db: Session = Depends(get_session),
):
    """비밀번호가 일치하면 GitHub 이슈를 닫고 로컬에서도 숨긴다.

    이전 구현은 로컬 DB를 먼저 커밋하고 GitHub를 호출해서, GitHub
    호출이 실패하면 우리 쪽은 삭제됐는데 이슈는 열려 있는 상태로
    갈라졌다. 목록은 어차피 DB를 원천으로 읽으므로 GitHub가 성공한
    뒤에 커밋해도 화면에는 즉시 반영된다.
    """
    metadata = _load_metadata(db, issue_number)

    if not verify_password(req.password, metadata.password_hash):
        raise HTTPException(status_code=403, detail="비밀번호가 일치하지 않습니다.")

    response = await update_github_issue(issue_number, {"state": "closed"})
    if response.status_code not in (200, 201):
        raise HTTPException(
            status_code=response.status_code, detail="GitHub 반영에 실패했습니다."
        )

    metadata.is_deleted = True
    db.add(metadata)
    db.commit()

    return {"message": "성공적으로 흔적을 지웠습니다."}
