from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.domain import User, Team, TeamMember
from pydantic import BaseModel
import uuid

router = APIRouter()

class TeamCreate(BaseModel):
    name: str

class TeamResponse(BaseModel):
    id: uuid.UUID
    name: str
    owner_id: uuid.UUID

    class Config:
        orm_mode = True

class InviteUser(BaseModel):
    email: str
    role: str = "VIEWER"

@router.post("/", response_model=TeamResponse)
def create_team(team_in: TeamCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    team = Team(name=team_in.name, owner_id=current_user.id)
    db.add(team)
    db.commit()
    db.refresh(team)
    
    # Add owner as ADMIN
    member = TeamMember(team_id=team.id, user_id=current_user.id, role="ADMIN")
    db.add(member)
    db.commit()
    
    return team

@router.get("/", response_model=List[TeamResponse])
def get_teams(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Returns teams where user is a member
    teams = db.query(Team).join(TeamMember).filter(TeamMember.user_id == current_user.id).all()
    return teams

@router.post("/{team_id}/invite")
def invite_member(team_id: uuid.UUID, invite: InviteUser, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify current user is admin of the team
    admin_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id, 
        TeamMember.user_id == current_user.id,
        TeamMember.role == "ADMIN"
    ).first()
    
    if not admin_member:
        raise HTTPException(status_code=403, detail="Not authorized to invite members to this team")
        
    user_to_invite = db.query(User).filter(User.email == invite.email).first()
    if not user_to_invite:
        raise HTTPException(status_code=404, detail="User not found")
        
    existing_member = db.query(TeamMember).filter(TeamMember.team_id == team_id, TeamMember.user_id == user_to_invite.id).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="User already in team")
        
    new_member = TeamMember(team_id=team_id, user_id=user_to_invite.id, role=invite.role)
    db.add(new_member)
    db.commit()
    return {"message": f"Invited {invite.email} to team"}

@router.delete("/{team_id}/members/{user_id}")
def remove_member(team_id: uuid.UUID, user_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id, 
        TeamMember.user_id == current_user.id,
        TeamMember.role == "ADMIN"
    ).first()
    
    if not admin_member and str(current_user.id) != str(user_id):
        raise HTTPException(status_code=403, detail="Not authorized to remove members")
        
    member = db.query(TeamMember).filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    db.delete(member)
    db.commit()
    return {"message": "Member removed from team"}
