import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid

from app.main import app
from app.database.session import Base, get_db
from app.api.deps import get_current_user
from app.models.domain import User, Project, File, TranslationJob, TranslationResult, AIConversation, AIMessage, Glossary, GlossaryTerm, UsageRecord, Plan, Subscription, Payment, Invoice

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, expire_on_commit=False)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def test_user(db_session):
    user = User(
        id=uuid.uuid4(),
        email="test@lingora.ai",
        hashed_password="fakehashedpassword",
        subscription_tier="FREE"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def authorized_client(client, test_user):
    # Override auth dependency
    def override_get_current_user():
        return test_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield client
    app.dependency_overrides.pop(get_current_user, None)
