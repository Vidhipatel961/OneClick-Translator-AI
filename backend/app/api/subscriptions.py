from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.domain import User, Plan, Subscription
from app.services.payment_provider import StripePaymentProvider
from app.services.subscription_service import SubscriptionService
from pydantic import BaseModel
from typing import List, Optional
import uuid
import datetime

router = APIRouter()
payment_provider = StripePaymentProvider()
subscription_service = SubscriptionService(payment_provider)

class PlanResponse(BaseModel):
    id: uuid.UUID
    name: str
    price: float
    billing_cycle: str
    
class CheckoutRequest(BaseModel):
    plan_name: str
    success_url: str
    cancel_url: str

class SubscriptionResponse(BaseModel):
    id: uuid.UUID
    plan_name: str
    status: str
    current_period_end: datetime.datetime

@router.get("/plans", response_model=List[PlanResponse])
async def get_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).all()
    if not plans:
        # Seed default plans
        plans = [
            Plan(name="FREE", price=0.0),
            Plan(name="PRO", price=19.99),
            Plan(name="BUSINESS", price=49.99),
            Plan(name="ENTERPRISE", price=199.99)
        ]
        db.add_all(plans)
        db.commit()
        for p in plans:
            db.refresh(p)
            
    return [{"id": p.id, "name": p.name, "price": p.price, "billing_cycle": p.billing_cycle} for p in plans]

@router.post("/checkout")
async def create_checkout(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(Plan).filter(Plan.name == request.plan_name).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    url = await payment_provider.create_checkout_session(
        str(current_user.id),
        str(plan.id),
        request.success_url,
        request.cancel_url
    )
    
    return {"checkout_url": url}

@router.post("/webhook")
async def handle_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    
    try:
        event = await payment_provider.verify_webhook(payload, signature)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    event_type = event.get("type")
    
    # Mocking webhook processing
    if event_type == "checkout.session.completed":
        user_id = event["data"]["object"]["client_reference_id"]
        plan_id = event["data"]["object"]["metadata"]["plan_id"]
        provider_sub_id = event["data"]["object"]["subscription"]
        
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if plan:
            await subscription_service.handle_payment_success(db, uuid.UUID(user_id), plan.name, provider_sub_id)
            
    elif event_type == "invoice.payment_failed":
        provider_sub_id = event["data"]["object"]["subscription"]
        await subscription_service.handle_payment_failure(db, provider_sub_id)
        
    elif event_type == "customer.subscription.deleted":
        provider_sub_id = event["data"]["object"]["id"]
        await subscription_service.handle_subscription_cancellation(db, provider_sub_id)
        
    return {"status": "success"}

@router.get("/my", response_model=Optional[SubscriptionResponse])
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id, Subscription.status == "ACTIVE").first()
    if not sub:
        return None
        
    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    return {
        "id": sub.id,
        "plan_name": plan.name if plan else "FREE",
        "status": sub.status,
        "current_period_end": sub.current_period_end
    }

@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id, Subscription.status == "ACTIVE").first()
    if not sub:
        raise HTTPException(status_code=400, detail="No active subscription")
        
    if sub.provider_subscription_id:
        success = await payment_provider.cancel_subscription(sub.provider_subscription_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to cancel with provider")
            
    await subscription_service.handle_subscription_cancellation(db, sub.provider_subscription_id or "")
    return {"status": "canceled"}
