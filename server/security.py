"""익명성과 권한 검증에 쓰이는 단방향 변환 모음.

이 프로젝트는 "서버 없이 익명 게시판을 만들 수 있는가"를 확인하려고
시작했고, 아래 두 가지를 클라이언트에 맡길 수 없다는 결론 때문에
서버를 도입했다. 그 결론이 실제로 구현되는 지점이 이 파일이다.

  1. 비밀번호 검증: 검증 주체가 클라이언트면 검증이 아니다.
  2. 요청자 식별: 클라이언트는 자기 IP를 신뢰 가능하게 말할 수 없다.
"""

import hashlib
import secrets
from datetime import date, timezone, datetime

import bcrypt

from config import SECRET_SALT


def hash_password(password: str) -> str:
    """수정/삭제 권한 검증용 비밀번호 해시를 만든다.

    bcrypt는 레코드마다 다른 솔트를 해시 문자열 안에 포함하고, work
    factor로 계산 비용을 조절할 수 있다.

    이전 구현은 `sha256(password).hexdigest()[:8]` 이었는데 두 가지가
    문제였다. 솔트가 없어 흔한 비밀번호는 즉시 역산되고, 32비트로
    절단해 충돌하는 다른 비밀번호로도 남의 글을 지울 수 있었다.
    """
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    """입력한 비밀번호가 저장된 해시와 일치하는지 확인한다."""
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        # 해시 형식이 깨진 레코드는 인증 실패로 처리한다.
        return False


def new_author_id() -> str:
    """화면에 노출되는 익명 표시용 ID를 발급한다.

    이전 구현은 비밀번호 해시를 그대로 표시용 ID로 내려보냈다. 비밀번호
    파생값을 공개한 셈이고, 같은 비밀번호를 쓴 사람끼리 같은 작성자로
    보이는 문제도 있었다. 표시용 ID는 비밀번호와 무관한 난수여야 한다.
    """
    return secrets.token_hex(4)


def hash_ip(client_ip: str) -> str:
    """도배 방지용 요청자 식별값을 만든다. 날짜가 바뀌면 값도 바뀐다.

    한계: IP는 경우의 수가 적어서 SECRET_SALT를 아는 쪽이라면 후보를
    대입해 원본 IP를 좁힐 수 있다. 게시글과 같은 행에 저장하는 현재
    구조로는 익명성을 완전히 보장하지 못한다(README의 '한계' 참고).
    """
    raw = f"{client_ip}{SECRET_SALT}{date.today().isoformat()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:12]


def utc_now() -> datetime:
    """timezone-aware 현재 시각. `datetime.utcnow()`는 3.12에서 deprecated."""
    return datetime.now(timezone.utc)
