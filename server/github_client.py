import httpx
from typing import Any, List, Optional, Dict
from config import GITHUB_API_URL, GITHUB_TOKEN, REPO_OWNER, REPO_NAME

async def create_github_issue(title: str, body: str, labels: Optional[List[str]] = None) -> httpx.Response:
    """새로운 익명 게시글을 GitHub 이슈로 생성합니다."""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.post(
            GITHUB_API_URL,
            headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
            },
            json={
                "title": title,
                "body": body,
                "labels": labels or [],
            },
        )
        if resp.status_code != 201:
            try:
                body = resp.json()
            except Exception:
                body = resp.text
            print(f"[github_client.create_github_issue] status={resp.status_code}, body={body}")
        return resp

async def list_github_issues(labels: str = "anonymous-post", state: str = "open") -> List[Any]:
    """등록된 익명 게시글 목록을 불러옵니다."""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(
            GITHUB_API_URL, # config에 이미 URL이 있으므로 그대로 사용 가능
            params={"labels": labels, "state": state},
            headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
            },
        )
        response.raise_for_status()
        return response.json()

async def update_github_issue(issue_number: int, payload: Dict[str, Any]) -> httpx.Response:
    """이슈의 제목, 본문, 상태 등을 범용적으로 수정합니다."""
    async with httpx.AsyncClient(follow_redirects=True) as client:
        # URL 구성 시 f-string 활용
        url = f"{GITHUB_API_URL}/{issue_number}"
        resp = await client.patch(
            url,
            headers={
                "Authorization": f"token {GITHUB_TOKEN}",
                "Accept": "application/vnd.github.v3+json",
            },
            json=payload,
        )
        if resp.status_code not in (200, 201):
            try:
                body = resp.json()
            except Exception:
                body = resp.text
            print(f"[github_client.update_github_issue] status={resp.status_code}, body={body}")
        return resp
