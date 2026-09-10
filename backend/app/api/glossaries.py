from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.domain import User, Glossary, GlossaryTerm
from app.schemas.glossary import GlossaryCreate, GlossaryUpdate, GlossaryResponse, GlossaryTermCreate, GlossaryTermUpdate, GlossaryTermResponse
import uuid

router = APIRouter()

@router.get("/", response_model=list[GlossaryResponse])
async def get_glossaries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Glossary).filter(Glossary.user_id == current_user.id).order_by(Glossary.created_at.desc()).all()

@router.post("/", response_model=GlossaryResponse)
async def create_glossary(
    request: GlossaryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    glossary = Glossary(
        user_id=current_user.id,
        name=request.name,
        description=request.description
    )
    db.add(glossary)
    db.commit()
    db.refresh(glossary)
    return glossary

@router.delete("/{glossary_id}")
async def delete_glossary(
    glossary_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    glossary = db.query(Glossary).filter(Glossary.id == glossary_id, Glossary.user_id == current_user.id).first()
    if not glossary:
        raise HTTPException(status_code=404, detail="Glossary not found")
    db.delete(glossary)
    db.commit()
    return {"status": "success"}

@router.get("/{glossary_id}/terms", response_model=list[GlossaryTermResponse])
async def get_terms(
    glossary_id: uuid.UUID,
    search: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    glossary = db.query(Glossary).filter(Glossary.id == glossary_id, Glossary.user_id == current_user.id).first()
    if not glossary:
        raise HTTPException(status_code=404, detail="Glossary not found")
        
    query = db.query(GlossaryTerm).filter(GlossaryTerm.glossary_id == glossary_id)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (GlossaryTerm.source_term.ilike(search_fmt)) | 
            (GlossaryTerm.target_term.ilike(search_fmt))
        )
    return query.all()

@router.post("/{glossary_id}/terms", response_model=GlossaryTermResponse)
async def add_term(
    glossary_id: uuid.UUID,
    request: GlossaryTermCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    glossary = db.query(Glossary).filter(Glossary.id == glossary_id, Glossary.user_id == current_user.id).first()
    if not glossary:
        raise HTTPException(status_code=404, detail="Glossary not found")
        
    term = GlossaryTerm(
        glossary_id=glossary.id,
        source_term=request.source_term,
        target_term=request.target_term,
        source_language=request.source_language,
        target_language=request.target_language
    )
    db.add(term)
    db.commit()
    db.refresh(term)
    return term

@router.delete("/{glossary_id}/terms/{term_id}")
async def delete_term(
    glossary_id: uuid.UUID,
    term_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    glossary = db.query(Glossary).filter(Glossary.id == glossary_id, Glossary.user_id == current_user.id).first()
    if not glossary:
        raise HTTPException(status_code=404, detail="Glossary not found")
        
    term = db.query(GlossaryTerm).filter(GlossaryTerm.id == term_id, GlossaryTerm.glossary_id == glossary_id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    db.delete(term)
    db.commit()
    return {"status": "success"}
