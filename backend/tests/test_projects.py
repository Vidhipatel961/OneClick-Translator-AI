import pytest
from app.models.domain import Project, User
import uuid

def test_create_project(authorized_client, test_user, db_session):
    response = authorized_client.post(
        "/api/projects/",
        json={"name": "My New Project", "description": "Test description"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My New Project"
    assert data["description"] == "Test description"
    assert data["user_id"] == str(test_user.id)
    assert "id" in data

def test_list_projects(authorized_client, test_user, db_session):
    # Setup: Create a project first
    project = Project(name="Project A", user_id=test_user.id)
    db_session.add(project)
    db_session.commit()

    response = authorized_client.get("/api/projects/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(p["name"] == "Project A" for p in data)

def test_get_project(authorized_client, test_user, db_session):
    project = Project(name="Project B", user_id=test_user.id)
    db_session.add(project)
    db_session.commit()

    response = authorized_client.get(f"/api/projects/{project.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Project B"
    assert data["id"] == str(project.id)

def test_delete_project(authorized_client, test_user, db_session):
    project = Project(name="Project to Delete", user_id=test_user.id)
    db_session.add(project)
    db_session.commit()
    project_id = str(project.id)

    response = authorized_client.delete(f"/api/projects/{project_id}")
    assert response.status_code == 204

    # Verify it's gone
    response = authorized_client.get(f"/api/projects/{project_id}")
    assert response.status_code == 404

def test_unauthorized_request(client):
    response = client.get("/api/projects/")
    assert response.status_code == 401

def test_cannot_access_other_user_project(authorized_client, client, db_session):
    # Create another user in DB
    other_user = User(
        id=uuid.uuid4(),
        email="other@lingora.ai",
        hashed_password="fake",
        subscription_tier="FREE"
    )
    # Create a project for the other user
    other_project = Project(name="Other Project", user_id=other_user.id)
    db_session.add(other_user)
    db_session.add(other_project)
    db_session.commit()

    # The authorized_client is 'test_user', not 'other_user'
    response = authorized_client.get(f"/api/projects/{other_project.id}")
    assert response.status_code == 404

    response = authorized_client.delete(f"/api/projects/{other_project.id}")
    assert response.status_code == 404

def test_invalid_project_name(authorized_client):
    # Too short (empty string)
    response = authorized_client.post(
        "/api/projects/",
        json={"name": "", "description": "Invalid name"}
    )
    assert response.status_code == 422

    # Missing name
    response = authorized_client.post(
        "/api/projects/",
        json={"description": "Missing name"}
    )
    assert response.status_code == 422

def test_duplicate_project_behavior(authorized_client, test_user, db_session):
    # Since there's no unique constraint on project name, it should allow duplicates
    response1 = authorized_client.post(
        "/api/projects/",
        json={"name": "Duplicate Project", "description": "First"}
    )
    assert response1.status_code == 201

    response2 = authorized_client.post(
        "/api/projects/",
        json={"name": "Duplicate Project", "description": "Second"}
    )
    assert response2.status_code == 201

    # Verify both exist
    response = authorized_client.get("/api/projects/")
    data = response.json()
    duplicates = [p for p in data if p["name"] == "Duplicate Project"]
    assert len(duplicates) == 2
