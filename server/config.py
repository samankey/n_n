from dotenv import load_dotenv
import os

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO_OWNER = os.getenv("REPO_OWNER")
REPO_NAME = os.getenv("REPO_NAME")

# 익명 식별값 해싱에 쓰이는 서버 전용 솔트. 이 값이 유출되면 ip_hash 를
# 되짚을 수 있으므로 GitHub 토큰과 같은 등급으로 취급한다.
SECRET_SALT = os.getenv("SECRET_SALT")

GITHUB_API_URL = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/issues"

# 필요한 환경변수가 없으면 즉시 실패한다.
missing = [
    name
    for name, val in (
        ("GITHUB_TOKEN", GITHUB_TOKEN),
        ("REPO_OWNER", REPO_OWNER),
        ("REPO_NAME", REPO_NAME),
        ("SECRET_SALT", SECRET_SALT),
    )
    if not val
]
if missing:
    raise RuntimeError(
        "Missing required environment variables: "
        + ", ".join(missing)
        + ". Please set them (e.g. in server/.env) before starting the server."
    )
