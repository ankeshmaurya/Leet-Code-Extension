from fastapi import FastAPI
from pydantic import BaseModel
from gpt_service import generate_solution
from database import engine
from models import Base, Log
from sqlalchemy.orm import Session
from database import SessionLocal
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LeetCode AI Solver API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Problem(BaseModel):
    title: str
    description: str
    language: str
    existingCode: str = ""  # Code template from LeetCode

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "LeetCode AI Solver API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/solve")
async def solve(problem: Problem):
    solution = await generate_solution(
        problem.title,
        problem.description,
        problem.language,
        problem.existingCode
    )

    db: Session = SessionLocal()
    log = Log(title=problem.title, status=f"Generated in {problem.language}")
    db.add(log)
    db.commit()
    db.close()

    return {"solution": solution}