from app.extensions import db
from app.database.schema import User, PasswordResetToken
from datetime import datetime, timezone, timedelta
import hashlib
import secrets


class AuthRepository:
    def get_by_email(self, email):
        return db.session.execute(
            db.select(User).where(User.email == email)
        ).unique().scalar_one_or_none()

    def get_by_id(self, id):
        return db.session.get(User, id)

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

    def create_reset_token(self, user_id):
        raw = secrets.token_urlsafe(32)
        hashed = hashlib.sha256(raw.encode()).hexdigest()
        token = PasswordResetToken(
            user_id=user_id,
            token=hashed,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.session.add(token)
        db.session.commit()
        return raw

    def get_reset_token(self, raw_token):
        hashed = hashlib.sha256(raw_token.encode()).hexdigest()
        return db.session.execute(
            db.select(PasswordResetToken).where(
                PasswordResetToken.token == hashed,
                PasswordResetToken.used_at.is_(None),
                PasswordResetToken.expires_at > datetime.now(timezone.utc),
            )
        ).scalar_one_or_none()

    def mark_token_used(self, token):
        token.used_at = datetime.now(timezone.utc)
        db.session.commit()
