from pydantic import BaseModel
from typing import Optional


class PostIssueRequest(BaseModel):
    title: str
    content: str
    password: str


class UpdateIssueRequest(BaseModel):
    password: str             # 본인 확인용 (필수)
    title: Optional[str] = None
    content: Optional[str] = None # body 대신 프론트엔드와 맞춘 이름

class DeleteRequest(BaseModel):
    password: str