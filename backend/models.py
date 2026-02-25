from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)