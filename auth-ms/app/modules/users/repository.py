from app.extensions import db
from app.database.schema import User


class UserRepository:
    def get_all(self):
        return db.session.execute(db.select(User)).unique().scalars().all()

    def get_by_id(self, id):
        return db.session.get(User, id)

    def get_by_email(self, email):
        return db.session.execute(
            db.select(User).where(User.email == email)
        ).unique().scalar_one_or_none()

    def create(self, email, name, password_hash, role_id=None, employee_id=None):
        user = User(email=email, name=name, password_hash=password_hash,
                    role_id=role_id, employee_id=employee_id)
        db.session.add(user)
        db.session.commit()
        return user

    def update(self, user, data):
        for key, value in data.items():
            setattr(user, key, value)
        db.session.commit()
        return user
