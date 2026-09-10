import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "lingora_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.audio_tasks", "app.tasks.video_tasks", "app.tasks.document_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_always_eager=os.getenv("CELERY_EAGER", "False").lower() == "true",
    task_eager_propagates=True,
)
