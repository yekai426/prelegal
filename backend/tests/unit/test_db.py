from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.session import reset_database
from app.models.user import User


def test_reset_database_creates_users_table(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    reset_database(engine)

    with Session(engine) as session:
        assert session.query(User).count() == 0


def test_reset_database_wipes_existing_rows(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    reset_database(engine)

    with Session(engine) as session:
        session.add(User(email="a@example.com", hashed_password="hash"))
        session.commit()
        assert session.query(User).count() == 1

    reset_database(engine)

    with Session(engine) as session:
        assert session.query(User).count() == 0
