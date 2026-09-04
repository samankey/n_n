from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

from security import utc_now


class PostMetadata(SQLModel, table=True):
    """GitHub 이슈에 담을 수 없는 관리용 메타데이터.

    본문은 GitHub Issues에, 권한 검증과 도배 방지에 쓰이는 값은 이 표에
    둔다. 콘텐츠 저장소에 민감한 값을 올리지 않기 위한 분리다.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    # GitHub 이슈 번호. 한 이슈에 메타데이터가 둘 이상 생기면 권한 검증이
    # 어느 행을 볼지 모호해지므로 unique 로 막는다.
    issue_number: int = Field(index=True, unique=True)
    # 화면에 노출되는 표시용 난수 ID. 비밀번호와 무관하다.
    author_id: str
    # 수정/삭제 권한 검증용 bcrypt 해시.
    password_hash: str
    # 도배 방지용 요청자 식별값 (당일 한정).
    ip_hash: str
    is_deleted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now)
