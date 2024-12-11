from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class SubscriptionTier(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"

class Subscription(BaseModel):
    user_id: str
    tier: SubscriptionTier
    status: SubscriptionStatus
    start_date: datetime
    end_date: Optional[datetime] = None
    story_count: int = 0  # Track stories generated this month