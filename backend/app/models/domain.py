from sqlalchemy import String, Integer, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from datetime import datetime
import uuid
import enum

from app.models.base import BaseModel

class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    EXTRACTING_AUDIO = "EXTRACTING_AUDIO"
    TRANSCRIBING = "TRANSCRIBING"
    TRANSLATING = "TRANSLATING"
    GENERATING_AUDIO = "GENERATING_AUDIO"
    GENERATING_SUBTITLES = "GENERATING_SUBTITLES"
    RENDERING_VIDEO = "RENDERING_VIDEO"
    EXTRACTING_TEXT = "EXTRACTING_TEXT"
    PERFORMING_OCR = "PERFORMING_OCR"
    TRANSLATING_DOCUMENT = "TRANSLATING_DOCUMENT"
    GENERATING_PDF = "GENERATING_PDF"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class User(BaseModel):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    subscription_tier: Mapped[str] = mapped_column(String(50), default="FREE") # FREE, PRO, BUSINESS
    
    projects: Mapped[List["Project"]] = relationship(back_populates="user")
    translation_jobs: Mapped[List["TranslationJob"]] = relationship(back_populates="user")
    usage: Mapped["UsageRecord"] = relationship(back_populates="user", uselist=False)

class Project(BaseModel):
    __tablename__ = "projects"
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    
    user: Mapped["User"] = relationship(back_populates="projects")
    files: Mapped[List["File"]] = relationship(back_populates="project")
    translation_jobs: Mapped[List["TranslationJob"]] = relationship(back_populates="project")
    translation_memories: Mapped[List["TranslationMemory"]] = relationship(back_populates="project")

class File(BaseModel):
    __tablename__ = "files"
    filename: Mapped[str] = mapped_column(String(255), index=True)
    file_type: Mapped[str] = mapped_column(String(255))
    storage_path: Mapped[str] = mapped_column(String(512))
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    
    project: Mapped[Optional["Project"]] = relationship(back_populates="files")
    translation_jobs: Mapped[List["TranslationJob"]] = relationship(back_populates="file")

class Language(BaseModel):
    __tablename__ = "languages"
    code: Mapped[str] = mapped_column(String(10), unique=True, index=True) # e.g. "en", "es"
    name: Mapped[str] = mapped_column(String(100))

class TranslationJob(BaseModel):
    __tablename__ = "translation_jobs"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    file_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("files.id"), nullable=True, index=True)
    source_language: Mapped[str] = mapped_column(String(10))
    target_language: Mapped[str] = mapped_column(String(10))
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus), default=JobStatus.PENDING, index=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    user: Mapped["User"] = relationship(back_populates="translation_jobs")
    project: Mapped[Optional["Project"]] = relationship(back_populates="translation_jobs")
    file: Mapped[Optional["File"]] = relationship(back_populates="translation_jobs")
    result: Mapped[Optional["TranslationResult"]] = relationship(back_populates="job")

class TranslationResult(BaseModel):
    __tablename__ = "translation_results"
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("translation_jobs.id"), unique=True)
    original_transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    result_file_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True) # For audio or video
    result_audio_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    result_image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    subtitles_srt_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    subtitles_vtt_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    translation_source: Mapped[str] = mapped_column(String(50), default="AI Translated")
    
    job: Mapped["TranslationJob"] = relationship(back_populates="result")

class AIConversation(BaseModel):
    __tablename__ = "ai_conversations"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    job_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("translation_jobs.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    
    user: Mapped["User"] = relationship()
    job: Mapped["TranslationJob"] = relationship()
    messages: Mapped[list["AIMessage"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")

class AIMessage(BaseModel):
    __tablename__ = "ai_messages"
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_conversations.id"))
    role: Mapped[str] = mapped_column(String(50)) # 'user' or 'assistant'
    content: Mapped[str] = mapped_column(Text)
    
    conversation: Mapped["AIConversation"] = relationship(back_populates="messages")

class Glossary(BaseModel):
    __tablename__ = "glossaries"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    user: Mapped["User"] = relationship()
    terms: Mapped[list["GlossaryTerm"]] = relationship(back_populates="glossary", cascade="all, delete-orphan")

class GlossaryTerm(BaseModel):
    __tablename__ = "glossary_terms"
    glossary_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("glossaries.id"))
    source_term: Mapped[str] = mapped_column(String(255))
    target_term: Mapped[str] = mapped_column(String(255))
    source_language: Mapped[str] = mapped_column(String(10))
    target_language: Mapped[str] = mapped_column(String(10))
    
    glossary: Mapped["Glossary"] = relationship(back_populates="terms")

class UsageRecord(BaseModel):
    __tablename__ = "usage_records"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True)
    characters_translated: Mapped[int] = mapped_column(Integer, default=0)
    audio_seconds: Mapped[int] = mapped_column(Integer, default=0)
    video_seconds: Mapped[int] = mapped_column(Integer, default=0)
    documents_processed: Mapped[int] = mapped_column(Integer, default=0)
    ai_requests: Mapped[int] = mapped_column(Integer, default=0)
    storage_bytes: Mapped[int] = mapped_column(Integer, default=0)
    
    user: Mapped["User"] = relationship(back_populates="usage")

class Plan(BaseModel):
    __tablename__ = "plans"
    name: Mapped[str] = mapped_column(String(50), unique=True) # FREE, PRO, BUSINESS, ENTERPRISE
    price: Mapped[float] = mapped_column(Float, default=0.0)
    billing_cycle: Mapped[str] = mapped_column(String(20), default="MONTHLY") # MONTHLY, YEARLY
    
class Subscription(BaseModel):
    __tablename__ = "subscriptions"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    plan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("plans.id"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", index=True) # ACTIVE, CANCELED, PAST_DUE, UNPAID, EXPIRED
    current_period_start: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    current_period_end: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    provider_subscription_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    user: Mapped["User"] = relationship()
    plan: Mapped["Plan"] = relationship()

class Payment(BaseModel):
    __tablename__ = "payments"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    subscription_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("subscriptions.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    status: Mapped[str] = mapped_column(String(50), default="PENDING") # PENDING, SUCCESS, FAILED
    provider_payment_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
class Invoice(BaseModel):
    __tablename__ = "invoices"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    subscription_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("subscriptions.id"), nullable=True)
    payment_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("payments.id"), nullable=True)
    invoice_number: Mapped[str] = mapped_column(String(100), unique=True)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

class TranslationMemory(BaseModel):
    __tablename__ = "translation_memories"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    source_language: Mapped[str] = mapped_column(String(10), index=True)
    target_language: Mapped[str] = mapped_column(String(10), index=True)
    source_text: Mapped[str] = mapped_column(Text)
    target_text: Mapped[str] = mapped_column(Text)
    
    user: Mapped["User"] = relationship()
    project: Mapped[Optional["Project"]] = relationship(back_populates="translation_memories")
