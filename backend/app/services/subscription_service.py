from sqlalchemy.orm import Session
from app.models.domain import User, Subscription, Plan, Payment, Invoice
from app.services.payment_provider import PaymentProvider
import uuid
from datetime import datetime, timedelta

class SubscriptionService:
    def __init__(self, provider: PaymentProvider):
        self.provider = provider
        
    async def handle_payment_success(self, db: Session, user_id: uuid.UUID, plan_name: str, provider_sub_id: str):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
            
        plan = db.query(Plan).filter(Plan.name == plan_name).first()
        if not plan:
            return
            
        # Deactivate old subscription
        old_sub = db.query(Subscription).filter(Subscription.user_id == user.id, Subscription.status == "ACTIVE").first()
        if old_sub:
            old_sub.status = "CANCELED"
            
        # Create new subscription
        new_sub = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            status="ACTIVE",
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30),
            provider_subscription_id=provider_sub_id
        )
        db.add(new_sub)
        
        # Sync user limit
        user.subscription_tier = plan.name
        
        # Record payment
        payment = Payment(
            user_id=user.id,
            amount=plan.price,
            status="SUCCESS",
            provider_payment_id="mock_charge_123"
        )
        db.add(payment)
        db.commit()
        
    async def handle_payment_failure(self, db: Session, provider_sub_id: str):
        sub = db.query(Subscription).filter(Subscription.provider_subscription_id == provider_sub_id).first()
        if sub:
            sub.status = "PAST_DUE"
            
            user = db.query(User).filter(User.id == sub.user_id).first()
            if user:
                user.subscription_tier = "FREE"
            db.commit()
            
    async def handle_subscription_cancellation(self, db: Session, provider_sub_id: str):
        sub = db.query(Subscription).filter(Subscription.provider_subscription_id == provider_sub_id).first()
        if sub:
            sub.status = "CANCELED"
            
            user = db.query(User).filter(User.id == sub.user_id).first()
            if user:
                user.subscription_tier = "FREE"
            db.commit()
