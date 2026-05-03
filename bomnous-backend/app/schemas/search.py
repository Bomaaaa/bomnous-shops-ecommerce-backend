from pydantic import BaseModel


class SearchRequest(BaseModel):
    keyword: str

