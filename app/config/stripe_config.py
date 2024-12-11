import stripe
from app.config.settings import settings

# Initialize Stripe with test key
stripe.api_key = settings.STRIPE_SECRET_KEY
stripe.api_version = "2023-10-16"  # Use latest API version

# Define subscription plans/products
SUBSCRIPTION_PLANS = {
    "basic": {
        "name": "Basic Plan",
        "price_id": "price_YOUR_BASIC_PRICE_ID",
        "features": ["Generate 20 stories/month", "Basic story templates", "Email support"]
    },
    "pro": {
        "name": "Pro Plan",
        "price_id": "price_YOUR_PRO_PRICE_ID",
        "features": ["Generate 100 stories/month", "Advanced templates", "Priority support"]
    },
    "unlimited": {
        "name": "Unlimited Plan",
        "price_id": "price_YOUR_UNLIMITED_PRICE_ID",
        "features": ["Unlimited story generation", "Custom templates", "24/7 support"]
    }
} 