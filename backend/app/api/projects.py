from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.domain import User, Project
from app.schemas.project import ProjectCreate, ProjectResponse

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all projects for the current authenticated user.
    """
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    return projects

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new project.
    """
    # Create the project object
    project = Project(
        name=project_in.name,
        description=project_in.description,
        user_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific project by ID.
    """
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific project by ID.
    """
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    db.delete(project)
    db.commit()
    
    # We do not return anything for 204 No Content
    return None
