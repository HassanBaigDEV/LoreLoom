from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class FeedbackStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    READ = "read"
    UNREAD = "unread"

class FeedbackType(str, Enum):
    BUG = "bug"
    FEATURE = "feature"
    GENERAL = "general"
    SUPPORT = "support"

class FeedbackCreate(BaseModel):
    title: str
    description: str
    type: FeedbackType
    screenshot_url: Optional[str] = None

class FeedbackResponse(FeedbackCreate):
    id: str
    user_id: str
    status: FeedbackStatus
    admin_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class FeedbackUpdate(BaseModel):
    admin_response: Optional[str] = None
    status: Optional[FeedbackStatus] = None

class FeedbackResponseCreate(BaseModel):
    response: str
    status: FeedbackStatus