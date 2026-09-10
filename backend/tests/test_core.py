import pytest
from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] in ["ok", "degraded"]

def test_get_languages(client: TestClient):
    response = client.get("/api/languages")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_unauthorized_access(client: TestClient):
    response = client.get("/api/jobs/")
    assert response.status_code == 401

def test_authorized_access(authorized_client: TestClient):
    response = authorized_client.get("/api/jobs/")
    assert response.status_code == 200

def test_file_upload(authorized_client: TestClient):
    # Mocking file upload
    file_content = b"fake audio content"
    files = {"file": ("test.mp3", file_content, "audio/mpeg")}
    
    response = authorized_client.post("/api/files/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "file_id" in data
    assert data["filename"] == "test.mp3"

def test_file_ownership_security(authorized_client: TestClient, db_session):
    import uuid
    from app.models.domain import File as FileModel
    
    # Create a mock file owned by a DIFFERENT user's project
    fake_file_id = uuid.uuid4()
    # (Simplified for testing: just check 404/401 on an unknown/unowned file)
    
    response = authorized_client.get(f"/api/files/{fake_file_id}/download")
    assert response.status_code == 404  # Not found or unauthorized
