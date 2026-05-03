from typing import Optional

from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=16)
    is_first_user_message: bool = Field(
        default=False,
        description="True for the first user message in this chat (warm name + intro as Bomnous).",
    )
    username: Optional[str] = Field(
        default=None,
        max_length=120,
        description="Display name for greetings, optional.",
    )


class ChatResponse(BaseModel):
    reply: str

