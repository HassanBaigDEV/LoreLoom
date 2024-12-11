from app.models.subscription import SubscriptionTier
from app.config.settings import settings

SUBSCRIPTION_PLANS = {
    SubscriptionTier.FREE: {
        "name": "Free Plan",
        "stories_per_month": 5,
        "features": ["Basic story templates", "Up to 1000 words per story"],
        "price": 0,
    },
    SubscriptionTier.BASIC: {
        "name": "Basic Plan",
        "stories_per_month": 20,
        "features": ["All Free features", "Up to 3000 words per story", "Save stories"],
        "price": 9.99,
        "stripe_price_id": settings.STRIPE_BASIC_PRICE_ID,
    },
    SubscriptionTier.PREMIUM: {
        "name": "Premium Plan",
        "stories_per_month": 100,
        "features": [
            "All Basic features",
            "Unlimited words per story",
            "Priority support",
        ],
        "price": 19.99,
        "stripe_price_id": settings.STRIPE_PREMIUM_PRICE_ID,
    },
}
