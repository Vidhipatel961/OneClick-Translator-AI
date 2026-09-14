import pytest
import uuid
from app.models.domain import Team, TeamMember, User

def test_create_team_positive(authorized_client, db_session, test_user):
    # Positive: Create a team
    payload = {"name": "QA Workspace"}
    response = authorized_client.post("/api/teams/", json=payload)
    if response.status_code != 200:
        print("ERROR:", response.json())
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "QA Workspace"
    assert data["owner_id"] == str(test_user.id)
    assert "id" in data
    
    # Verify DB state
    team_id = uuid.UUID(data["id"])
    team = db_session.query(Team).filter(Team.id == team_id).first()
    assert team is not None
    
    member = db_session.query(TeamMember).filter(TeamMember.team_id == team_id).first()
    assert member.user_id == test_user.id
    assert member.role == "ADMIN"

def test_get_teams(authorized_client, db_session, test_user):
    # Setup mock team
    team = Team(name="Mock Team", owner_id=test_user.id)
    db_session.add(team)
    db_session.commit()
    
    member = TeamMember(team_id=team.id, user_id=test_user.id, role="ADMIN")
    db_session.add(member)
    db_session.commit()
    
    # Positive: Fetch teams
    response = authorized_client.get("/api/teams/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Mock Team"

def test_invite_member_unauthorized_negative(authorized_client, db_session, test_user):
    # Negative: Try to invite someone to a team where user is only a VIEWER
    team = Team(name="Others Team", owner_id=uuid.uuid4())
    db_session.add(team)
    db_session.commit()
    
    member = TeamMember(team_id=team.id, user_id=test_user.id, role="VIEWER")
    db_session.add(member)
    db_session.commit()
    
    payload = {"email": "newbie@lingora.ai", "role": "EDITOR"}
    response = authorized_client.post(f"/api/teams/{team.id}/invite", json=payload)
    
    # Verify Forbidden
    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]

def test_invite_member_positive(authorized_client, db_session, test_user):
    # Setup team with admin access
    team = Team(name="Admin Workspace", owner_id=test_user.id)
    db_session.add(team)
    db_session.commit()
    
    member = TeamMember(team_id=team.id, user_id=test_user.id, role="ADMIN")
    db_session.add(member)
    
    # Create the user to invite
    new_user = User(email="colleague@lingora.ai", hashed_password="pw")
    db_session.add(new_user)
    db_session.commit()
    
    # Positive: Send invite
    payload = {"email": "colleague@lingora.ai", "role": "EDITOR"}
    response = authorized_client.post(f"/api/teams/{team.id}/invite", json=payload)
    
    assert response.status_code == 200
    
    # Verify member added
    new_member = db_session.query(TeamMember).filter(TeamMember.user_id == new_user.id).first()
    assert new_member is not None
    assert new_member.team_id == team.id
    assert new_member.role == "EDITOR"

def test_invite_member_not_found_negative(authorized_client, db_session, test_user):
    team = Team(name="Admin Workspace", owner_id=test_user.id)
    db_session.add(team)
    db_session.commit()
    member = TeamMember(team_id=team.id, user_id=test_user.id, role="ADMIN")
    db_session.add(member)
    db_session.commit()
    
    # Negative: Invite user that doesn't exist
    payload = {"email": "does_not_exist@lingora.ai", "role": "EDITOR"}
    response = authorized_client.post(f"/api/teams/{team.id}/invite", json=payload)
    
    assert response.status_code == 404
    assert "User not found" in response.json()["detail"]
