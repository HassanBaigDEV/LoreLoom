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
    return {
        "_id": str(subscription.get("_id")) if subscription.get("_id") else None,
        "user_id": (
            str(subscription.get("user_id")) if subscription.get("user_id") else None
        ),
        "tier": subscription.get("tier"),
        "status": subscription.get("status"),
        "start_date": (
            subscription.get("start_date")
            if subscription.get("start_date")
            else None
        ),
        "end_date": (
            subscription.get("end_date")
            if subscription.get("end_date")
            else None
        ),
        "story_count": subscription.get("story_count"),
        "stripe_subscription_id": subscription.get("stripe_subscription_id"),
        "stripe_customer_id": subscription.get("stripe_customer_id"),
        "price_id": subscription.get("price_id"),
        "created_at": (
            subscription.get("created_at")
            if subscription.get("created_at")
            else None
        ),
        "updated_at": (
            subscription.get("updated_at")
            if subscription.get("updated_at")
            else None
        )
    }


@subscription_router.get("/plans")
async def get_subscription_plans():
    return SUBSCRIPTION_PLANS


@subscription_router.get("/my-subscription")
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    user_oid = ObjectId(current_user["sub"])
    subscription = await subscriptions_collection.find_one({"user_id": user_oid})

    if not subscription:
        subscription_data = {
            "user_id": user_oid,
            "tier": SubscriptionTier.FREE,
            "status": SubscriptionStatus.ACTIVE,
            "start_date": datetime.now(),
            "story_count": 0,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        result = await subscriptions_collection.insert_one(subscription_data)
        subscription_data["_id"] = result.inserted_id
        return clean_subscription_data(subscription_data)

    return clean_subscription_data(subscription)


@subscription_router.post("/create-checkout-session/{tier}")
async def create_checkout_session(
    tier: SubscriptionTier, current_user: dict = Depends(get_current_user)
):
    """Create a Stripe checkout session for subscription"""
    if tier == SubscriptionTier.FREE:
        raise HTTPException(
            status_code=400, detail="Cannot create checkout session for free tier"
        )

    user_oid = ObjectId(current_user["sub"])
    user = await db["users"].find_one({"_id": user_oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stripe_customer_id = user.get("stripe_customer_id")
    if not stripe_customer_id:
        try:
            customer = stripe.Customer.create(
                email=user["email"], metadata={"user_id": current_user["sub"]}
            )
            await db["users"].update_one(
                {"_id": user_oid}, {"$set": {"stripe_customer_id": customer.id}}
            )
            stripe_customer_id = customer.id
        except Exception as e:
            logger.error(f"Error creating Stripe customer: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to create Stripe customer"
            )

    # 👇 NEW LOGIC: Cancel existing subscription if there is one
    existing_subscription = await subscriptions_collection.find_one(
        {"user_id": user_oid}
    )

    if existing_subscription and existing_subscription.get("stripe_subscription_id"):
        try:
            stripe.Subscription.modify(
                existing_subscription["stripe_subscription_id"],
                cancel_at_period_end=True,
            )
            logger.info(
                f"Scheduled cancellation for subscription {existing_subscription['stripe_subscription_id']}"
            )
        except Exception as e:
            logger.error(f"Failed to cancel existing subscription: {e}")

    try:
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=["card"],
            line_items=[
                {"price": SUBSCRIPTION_PLANS[tier]["stripe_price_id"], "quantity": 1}
            ],
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
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe signature header")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except SignatureVerificationError as e:
        logger.error(f"Invalid Stripe signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    event_type = event["type"]
    logger.info(f"Received Stripe event: {event_type}")

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        subscription_id = session.get("subscription")
        if subscription_id:
            await handle_successful_subscription(sub_id=subscription_id)

    elif event_type == "customer.subscription.created":
        subscription_obj = event["data"]["object"]
        await handle_successful_subscription(stripe_obj=subscription_obj)

    return {"status": "success"}


async def handle_successful_subscription(*, sub_id: str = "", stripe_obj=None):
    if stripe_obj is None:
        stripe_sub = stripe.Subscription.retrieve(sub_id)
    else:
        stripe_sub = stripe_obj

    try:
        price_id = stripe_sub["items"]["data"][0]["price"]["id"]
    except Exception as e:
        logger.error(f"Error extracting price id: {e}")
        return

    tier = None
    if price_id == settings.STRIPE_BASIC_PRICE_ID:
        tier = SubscriptionTier.BASIC
    elif price_id == settings.STRIPE_PREMIUM_PRICE_ID:
        tier = SubscriptionTier.PREMIUM
    else:
        logger.error(f"Unknown price_id: {price_id}")
        return

    customer_id = stripe_sub["customer"]
    user = await db["users"].find_one({"stripe_customer_id": customer_id})
    if not user:
        logger.error(f"User not found for customer {customer_id}")
        return
    user_oid = user["_id"]

    subscription_data = {
        "user_id": user_oid,
        "tier": tier,
        "status": SubscriptionStatus.ACTIVE,
        "stripe_subscription_id": stripe_sub["id"],
        "stripe_customer_id": customer_id,
        "start_date": datetime.fromtimestamp(stripe_sub["current_period_start"]),
        "end_date": datetime.fromtimestamp(stripe_sub["current_period_end"]),
        "story_count": 0,
        "price_id": price_id,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }

    logger.info(f"Saving subscription: {subscription_data}")
    await subscriptions_collection.update_one(
        {"user_id": user_oid}, {"$set": subscription_data}, upsert=True
    )

    await db["users"].update_one(
        {"_id": user_oid},
        {
            "$set": {
                "subscription_tier": tier,
                "subscription_status": SubscriptionStatus.ACTIVE,
                "stripe_subscription_id": stripe_sub["id"],
            }
        },
    )


# ✅ New: Cancel subscription
@subscription_router.post("/cancel-subscription")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    user_oid = ObjectId(current_user["sub"])
    subscription = await subscriptions_collection.find_one({"user_id": user_oid})
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")

    stripe_subscription_id = subscription.get("stripe_subscription_id")
    if stripe_subscription_id:
        try:
            stripe.Subscription.delete(stripe_subscription_id)
        except Exception as e:
            logger.error(f"Error canceling Stripe subscription: {e}")
            raise HTTPException(
                status_code=400, detail="Failed to cancel Stripe subscription"
            )

    # Update local DB
    await subscriptions_collection.update_one(
        {"user_id": user_oid},
        {
            "$set": {
                "tier": SubscriptionTier.FREE,
                "status": SubscriptionStatus.EXPIRED,
                "updated_at": datetime.now(),
            }
        },
    )
    await db["users"].update_one(
        {"_id": user_oid},
        {
            "$set": {
                "subscription_tier": SubscriptionTier.FREE,
                "subscription_status": SubscriptionStatus.EXPIRED,
            }
        },
    )

    return {"message": "Subscription cancelled and downgraded to Free plan."}


@subscription_router.get("/subscription-limits")
async def get_subscription_limits(current_user: dict = Depends(get_current_user)):
    user_oid = ObjectId(current_user["sub"])
    
    # Get user's subscription
    subscription = await subscriptions_collection.find_one({"user_id": user_oid})
    if not subscription:
        # Create free subscription if none exists
        subscription_data = {
            "user_id": user_oid,
            "tier": SubscriptionTier.FREE,
            "status": SubscriptionStatus.ACTIVE,
            "start_date": datetime.now(),
            "story_count": 0,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
        result = await subscriptions_collection.insert_one(subscription_data)
        subscription_data["_id"] = result.inserted_id
        subscription = subscription_data

    # Get story count for current month
    current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    stories_this_month = await db["stories"].count_documents({
        "author": user_oid,
        "created_at": {"$gte": current_month_start}
    })

    # Define limits based on tier
    tier_limits = {
        SubscriptionTier.FREE: 3,
        SubscriptionTier.BASIC: 15,
        SubscriptionTier.PREMIUM: float('inf')  # Unlimited
    }

    tier = subscription.get("tier", SubscriptionTier.FREE)
    story_limit = tier_limits.get(tier, 3)  # Default to free tier limit
    stories_left = float('inf') if story_limit == float('inf') else max(0, story_limit - stories_this_month)
    limit_reached = stories_left == 0

    return {
        "tier": tier.lower(),
        "story_limit": story_limit if story_limit != float('inf') else "unlimited",
        "stories_left": stories_left if stories_left != float('inf') else "unlimited",
        "limit_reached": limit_reached
    }
