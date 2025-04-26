from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timedelta
from app.utils.dependencies import get_current_user
from app.models.subscription import SubscriptionTier, SubscriptionStatus
from app.config.subscription_config import SUBSCRIPTION_PLANS
from app.config.database import db
from app.config.stripe_config import stripe
from app.config.settings import settings
from bson import ObjectId
from stripe.error import StripeError, SignatureVerificationError
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

subscription_router = APIRouter()
subscriptions_collection = db["subscriptions"]


def clean_subscription_data(subscription: dict) -> dict:
    """Convert ObjectId and datetime fields to JSON-serializable types."""
    return {
        "_id": str(subscription.get("_id")) if subscription.get("_id") else None,
        "user_id": str(subscription.get("user_id")) if subscription.get("user_id") else None,
        "tier": subscription.get("tier"),
        "status": subscription.get("status"),
        "start_date": subscription.get("start_date") if subscription.get("start_date") else None,
        "end_date": subscription.get("end_date") if subscription.get("end_date") else None,
        "story_count": subscription.get("story_count"),
        "stripe_subscription_id": subscription.get("stripe_subscription_id"),
        "stripe_customer_id": subscription.get("stripe_customer_id"),
        "price_id": subscription.get("price_id"),
        "created_at": subscription.get("created_at") if subscription.get("created_at") else None,
        "updated_at": subscription.get("updated_at") if subscription.get("updated_at") else None,
    }


@subscription_router.get("/plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    return SUBSCRIPTION_PLANS


@subscription_router.get("/my-subscription")
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    """Get current user's subscription"""
    logger.info(f"Current user: {current_user}")
    user_oid = ObjectId(current_user["sub"])
    subscription = await subscriptions_collection.find_one({"user_id": user_oid})

    if not subscription:
        # Create free subscription for new users
        subscription_data = {
            "user_id": user_oid,
            "tier": SubscriptionTier.FREE,
            "status": SubscriptionStatus.ACTIVE,
            "start_date": datetime.now(),
            "story_count": 0,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        result = await subscriptions_collection.insert_one(subscription_data)
        subscription_data["_id"] = result.inserted_id
        return clean_subscription_data(subscription_data)

    return clean_subscription_data(subscription)


@subscription_router.post("/upgrade/{tier}")
async def upgrade_subscription(
    tier: SubscriptionTier,
    current_user: dict = Depends(get_current_user)
):
    """Upgrade subscription to a new tier"""
    if tier not in [SubscriptionTier.BASIC, SubscriptionTier.PREMIUM]:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    user_oid = ObjectId(current_user["sub"])
    new_subscription = {
        "user_id": user_oid,
        "tier": tier,
        "status": SubscriptionStatus.ACTIVE,
        "start_date": datetime.now(),
        "end_date": datetime.now() + timedelta(days=30),
        "story_count": 0,
        "updated_at": datetime.now()
    }
    await subscriptions_collection.update_one(
        {"user_id": user_oid},
        {"$set": new_subscription},
        upsert=True
    )
    return {"message": f"Successfully upgraded to {tier} plan"}


@subscription_router.get("/check-limits")
async def check_subscription_limits(current_user: dict = Depends(get_current_user)):
    """Check current subscription limits"""
    user_oid = ObjectId(current_user["sub"])
    subscription = await subscriptions_collection.find_one({"user_id": user_oid})

    if not subscription:
        free_plan = SUBSCRIPTION_PLANS[SubscriptionTier.FREE]
        return {
            "can_generate": True,
            "remaining_stories": free_plan["stories_per_month"],
            "tier": SubscriptionTier.FREE
        }

    plan = SUBSCRIPTION_PLANS[subscription["tier"]]
    remaining = plan["stories_per_month"] - subscription.get("story_count", 0)
    return {
        "can_generate": remaining > 0,
        "remaining_stories": remaining,
        "tier": subscription["tier"]
    }


@subscription_router.post("/increment-story-count")
async def increment_story_count(current_user: dict = Depends(get_current_user)):
    """Increment the story count for the current month"""
    user_oid = ObjectId(current_user["sub"])
    result = await subscriptions_collection.update_one(
        {"user_id": user_oid},
        {"$inc": {"story_count": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Story count incremented"}


@subscription_router.post("/create-checkout-session/{tier}")
async def create_checkout_session(
    tier: SubscriptionTier,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe checkout session for subscription"""
    if tier == SubscriptionTier.FREE:
        raise HTTPException(status_code=400, detail="Cannot create checkout session for free tier")

    user_oid = ObjectId(current_user["sub"])
    user = await db["users"].find_one({"_id": user_oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create or retrieve Stripe customer
    stripe_customer_id = user.get("stripe_customer_id")
    if not stripe_customer_id:
        try:
            customer = stripe.Customer.create(
                email=user["email"],
                metadata={"user_id": current_user["sub"]}
            )
            await db["users"].update_one(
                {"_id": user_oid},
                {"$set": {"stripe_customer_id": customer.id}}
            )
            stripe_customer_id = customer.id
        except Exception as e:
            logger.error(f"Error creating Stripe customer: {e}")
            raise HTTPException(status_code=500, detail="Failed to create Stripe customer")

    try:
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": SUBSCRIPTION_PLANS[tier]["stripe_price_id"],
                "quantity": 1,
            }],
            mode="subscription",
            success_url=f"{settings.FRONTEND_URL}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/subscription/cancel",
        )
        return {"checkout_url": checkout_session.url}
    except StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@subscription_router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe signature header")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail=f"Invalid signature: {e}")

    # Dispatch event
    if event.type == "checkout.session.completed":
        session = event.data.object
        await handle_successful_subscription(session)
    elif event.type == "customer.subscription.created":
        # Optionally handle subscription created
        pass
    elif event.type == "invoice.paid":
        # Optionally handle invoice paid
        pass

    return {"status": "success"}


async def handle_successful_subscription(session):
    """Handle successful subscription payment"""
    customer_id = session.customer
    subscription_id = session.subscription

    # Retrieve Stripe subscription details
    stripe_sub = stripe.Subscription.retrieve(subscription_id)
    price_id = stripe_sub.items.data[0].price.id

    # Determine tier
    if price_id == settings.STRIPE_BASIC_PRICE_ID:
        tier = SubscriptionTier.BASIC
    elif price_id == settings.STRIPE_PREMIUM_PRICE_ID:
        tier = SubscriptionTier.PREMIUM
    else:
        raise HTTPException(status_code=400, detail="Unknown subscription tier")

    # Find user by Stripe customer
    user = await db["users"].find_one({"stripe_customer_id": customer_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found for Stripe customer")
    user_oid = user["_id"]

    # Prepare subscription record
    subscription_data = {
        "user_id": user_oid,
        "tier": tier,
        "status": SubscriptionStatus.ACTIVE,
        "stripe_subscription_id": subscription_id,
        "stripe_customer_id": customer_id,
        "start_date": datetime.now(),
        "end_date": datetime.fromtimestamp(stripe_sub.current_period_end),
        "story_count": 0,
        "price_id": price_id,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }

    # Upsert subscription in DB
    await subscriptions_collection.update_one(
        {"user_id": user_oid},
        {"$set": subscription_data},
        upsert=True
    )

    # Update user profile
    await db["users"].update_one(
        {"_id": user_oid},
        {"$set": {
            "subscription_tier": tier,
            "subscription_status": SubscriptionStatus.ACTIVE,
            "stripe_subscription_id": subscription_id
        }}
    )

    return subscription_data