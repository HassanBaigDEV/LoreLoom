from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timedelta
from app.utils.dependencies import get_current_user
from app.models.subscription import Subscription, SubscriptionTier, SubscriptionStatus
from app.config.subscription_config import SUBSCRIPTION_PLANS
from app.config.database import db
import stripe
from app.config.stripe_config import stripe
from app.config.settings import settings
from bson import ObjectId
from stripe.error import StripeError, SignatureVerificationError
import logging 
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

subscription_router = APIRouter()
subscriptions_collection = db["subscriptions"]

@subscription_router.get("/plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    return SUBSCRIPTION_PLANS

@subscription_router.get("/my-subscription")
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    """Get current user's subscription"""
    logger.info(f"Current user: {current_user}")  # Debug log
    subscription = await subscriptions_collection.find_one(
        {"user_id": str(current_user["sub"])}
    )
    
    
    if not subscription:
        # Create free subscription for new users
        subscription_data = {
            "user_id": str(current_user["sub"]),
            "tier": SubscriptionTier.FREE,
            "status": SubscriptionStatus.ACTIVE,
            "start_date": datetime.now(),
            "story_count": 0,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        await subscriptions_collection.insert_one(subscription_data)
        return subscription_data
    
    # Convert ObjectId to string and format the response
    subscription_response = {
        **subscription,
        "_id": str(subscription["_id"]) if "_id" in subscription else None,
        "start_date": subscription["start_date"].isoformat() if "start_date" in subscription else None,
        "end_date": subscription["end_date"].isoformat() if "end_date" in subscription else None,
        "created_at": subscription["created_at"].isoformat() if "created_at" in subscription else None,
        "updated_at": subscription["updated_at"].isoformat() if "updated_at" in subscription else None
    }
    
    return subscription_response

@subscription_router.post("/upgrade/{tier}")
async def upgrade_subscription(
    tier: SubscriptionTier,
    current_user: dict = Depends(get_current_user)
):
    """Upgrade subscription to a new tier"""
    if tier not in [SubscriptionTier.BASIC, SubscriptionTier.PREMIUM]:
        raise HTTPException(status_code=400, detail="Invalid subscription tier")
    
    # In a real application, you would handle payment here
    
    subscription = {
        "user_id": str(current_user["sub"]),
        "tier": tier,
        "status": SubscriptionStatus.ACTIVE,
        "start_date": datetime.now(),
        "end_date": datetime.now() + timedelta(days=30),  # 30-day subscription
        "story_count": 0
    }
    
    await subscriptions_collection.update_one(
        {"user_id": str(current_user["sub"])},
        {"$set": subscription},
        upsert=True
    )
    
    return {"message": f"Successfully upgraded to {tier} plan"}

@subscription_router.get("/check-limits")
async def check_subscription_limits(current_user: dict = Depends(get_current_user)):
    """Check current subscription limits"""
    subscription = await subscriptions_collection.find_one(
        {"user_id": str(current_user["sub"])}
    )
    
    if not subscription:
        return {
            "can_generate": True,
            "remaining_stories": SUBSCRIPTION_PLANS[SubscriptionTier.FREE]["stories_per_month"],
            "tier": SubscriptionTier.FREE
        }
    
    plan = SUBSCRIPTION_PLANS[subscription["tier"]]
    remaining = plan["stories_per_month"] - subscription["story_count"]
    
    return {
        "can_generate": remaining > 0,
        "remaining_stories": remaining,
        "tier": subscription["tier"]
    }

@subscription_router.post("/increment-story-count")
async def increment_story_count(current_user: dict = Depends(get_current_user)):
    """Increment the story count for the current month"""
    result = await subscriptions_collection.update_one(
        {"user_id": str(current_user["sub"])},
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
    
    try:
        # Get user without ObjectId conversion since sub is already a string
        user = await db["users"].find_one({"_id": current_user["sub"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"User found: {user}")  # Debug log
        print(f"Plan details: {SUBSCRIPTION_PLANS[tier]}")  # Debug log
        
        # Create or get Stripe customer
        stripe_customer_id = user.get("stripe_customer_id")
        if not stripe_customer_id:
            try:
                customer = stripe.Customer.create(
                    email=user["email"],
                    metadata={"user_id": current_user["sub"]}
                )
                print(f"Created Stripe customer: {customer}")  # Debug log
                await db["users"].update_one(
                    {"_id": current_user["sub"]},
                    {"$set": {"stripe_customer_id": customer.id}}
                )
                customer_id = customer.id
            except Exception as e:
                print(f"Error creating Stripe customer: {str(e)}")  # Debug log
                raise
        else:
            customer_id = stripe_customer_id

        try:
            # Create checkout session
            checkout_session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[{
                    "price": SUBSCRIPTION_PLANS[tier]["stripe_price_id"],
                    "quantity": 1,
                }],
                mode="subscription",
                success_url=f"{settings.FRONTEND_URL}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/subscription/cancel",
            )
            print(f"Created checkout session: {checkout_session}")  # Debug log
        except Exception as e:
            print(f"Error creating checkout session: {str(e)}")  # Debug log
            raise

        return {"checkout_url": checkout_session.url}

    except StripeError as e:
        print(f"Stripe error: {str(e)}")  # Debug log
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))

@subscription_router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        # Get the webhook data
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        if not sig_header:
            raise HTTPException(status_code=400, detail="No signature header")
        
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid signature: {str(e)}")
        
        print(f"Received event type: {event.type}")  # Debug log
        
        # Handle different event types
        if event.type == "checkout.session.completed":
            session = event.data.object
            print(f"Processing checkout session: {session.id}")  # Debug log
            await handle_successful_subscription(session)
        elif event.type == "customer.subscription.created":
            subscription = event.data.object
            print(f"New subscription created: {subscription.id}")  # Debug log
            # You might want to handle this event as well
        elif event.type == "invoice.paid":
            invoice = event.data.object
            print(f"Invoice paid: {invoice.id}")  # Debug log
            # Handle successful payment
            
        return {"status": "success"}
    
    except HTTPException as e:
        print(f"HTTP Exception in webhook: {str(e)}")  # Debug log
        raise e
    except Exception as e:
        print(f"Unexpected error in webhook: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))

async def handle_successful_subscription(session):
    """Handle successful subscription payment"""
    try:
        print(f"Starting to handle subscription for session: {session.id}")  # Debug log
        
        customer_id = session.customer
        subscription_id = session.subscription
        
        print(f"Customer ID: {customer_id}, Subscription ID: {subscription_id}")  # Debug log
        
        # Get subscription details from Stripe
        subscription = stripe.Subscription.retrieve(subscription_id)
        price_id = subscription.items.data[0].price.id
        
        print(f"Retrieved price ID: {price_id}")  # Debug log
        
        # Determine tier from price ID
        tier = None
        if price_id == settings.STRIPE_BASIC_PRICE_ID:
            tier = SubscriptionTier.BASIC
        elif price_id == settings.STRIPE_PREMIUM_PRICE_ID:
            tier = SubscriptionTier.PREMIUM
            
        print(f"Determined tier: {tier}")  # Debug log
        
        if not tier:
            raise HTTPException(status_code=400, detail="Invalid subscription tier")
        
        # Update user's subscription in database
        user = await db["users"].find_one({"stripe_customer_id": customer_id})
        if not user:
            print(f"No user found for customer ID: {customer_id}")  # Debug log
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"Found user: {user['_id']}")  # Debug log
        
        # Create subscription document
        subscription_data = {
            "user_id": str(user["_id"]),
            "tier": tier,
            "status": SubscriptionStatus.ACTIVE,
            "stripe_subscription_id": subscription_id,
            "stripe_customer_id": customer_id,
            "start_date": datetime.now(),
            "end_date": datetime.fromtimestamp(subscription.current_period_end),
            "story_count": 0,
            "price_id": price_id,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        print(f"Prepared subscription data: {subscription_data}")  # Debug log
        
        # Use upsert to either update existing subscription or create new one
        result = await subscriptions_collection.update_one(
            {"user_id": str(user["_id"])},
            {"$set": subscription_data},
            upsert=True
        )
        
        print(f"Subscription upsert result - modified: {result.modified_count}, upserted_id: {result.upserted_id}")  # Debug log
        
        # Also update user document with subscription info
        await db["users"].update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "subscription_tier": tier,
                    "subscription_status": SubscriptionStatus.ACTIVE,
                    "stripe_subscription_id": subscription_id
                }
            }
        )
        
        print("Successfully updated user and subscription")  # Debug log
        return subscription_data
        
    except Exception as e:
        print(f"Error in handle_successful_subscription: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Error handling subscription: {str(e)}")