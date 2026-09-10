from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class PaymentProvider(ABC):
    @abstractmethod
    async def create_checkout_session(self, user_id: str, plan_id: str, success_url: str, cancel_url: str) -> str:
        """Create a checkout session and return the URL"""
        pass
        
    @abstractmethod
    async def cancel_subscription(self, provider_subscription_id: str) -> bool:
        """Cancel an active subscription"""
        pass
        
    @abstractmethod
    async def verify_webhook(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Verify webhook signature and return parsed event"""
        pass

# Mock Implementation
class StripePaymentProvider(PaymentProvider):
    async def create_checkout_session(self, user_id: str, plan_id: str, success_url: str, cancel_url: str) -> str:
        return f"{success_url}?session_id=mock_session_123"
        
    async def cancel_subscription(self, provider_subscription_id: str) -> bool:
        return True
        
    async def verify_webhook(self, payload: bytes, signature: str) -> Dict[str, Any]:
        # Mock webhook payload mapping
        import json
        data = json.loads(payload)
        return data
