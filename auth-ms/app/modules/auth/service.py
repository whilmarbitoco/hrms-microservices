from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token
from app.modules.auth.repository import AuthRepository
from app.errors.handlers import ConflictError, UnauthorizedError, NotFoundError, ValidationError
from app.events.producer import publish


class AuthService:
    def __init__(self, repository: AuthRepository = None):
        self.repository = repository or AuthRepository()

    def _build_token_identity(self, user):
        permissions = [p.name for p in user.role.permissions] if user.role else []
        additional_claims = {
            "email": user.email,
            "role": user.role.name if user.role else None,
            "employee_id": user.employee_id,
            "is_active": user.is_active,
            "permissions": permissions,
        }
        return str(user.id), additional_claims

    def register(self, email, name, password, role_id=None, employee_id=None):
        if self.repository.get_by_email(email):
            raise ConflictError("Email already registered")
        password_hash = generate_password_hash(password)
        user = self.repository.create(email, name, password_hash, role_id, employee_id)
        publish("user.created", {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.name if user.role else None,
            "employee_id": user.employee_id,
        })
        return user

    def login(self, email, password):
        user = self.repository.get_by_email(email)
        if not user or not check_password_hash(user.password_hash or "", password):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedError("Account is deactivated")
        identity, claims = self._build_token_identity(user)
        access_token = create_access_token(identity=identity, additional_claims=claims)
        refresh_token = create_refresh_token(identity=identity, additional_claims=claims)
        return access_token, refresh_token, user

    def refresh(self, user_id):
        user = self.repository.get_by_id(int(user_id))
        if not user or not user.is_active:
            raise UnauthorizedError("Account is deactivated")
        identity, claims = self._build_token_identity(user)
        return create_access_token(identity=identity, additional_claims=claims)

    def get_me(self, user_id):
        user = self.repository.get_by_id(int(user_id))
        if not user:
            raise NotFoundError("User not found")
        return user

    def change_password(self, user_id, current_password, new_password):
        user = self.repository.get_by_id(int(user_id))
        if not check_password_hash(user.password_hash or "", current_password):
            raise UnauthorizedError("Current password is incorrect")
        self.repository.update(user, {"password_hash": generate_password_hash(new_password)})

    def forgot_password(self, email):
        user = self.repository.get_by_email(email)
        if not user:
            return  # silent — don't reveal if email exists
        raw_token = self.repository.create_reset_token(user.id)
        # In production this would send an email — for now return the token
        return raw_token

    def reset_password(self, raw_token, new_password):
        token = self.repository.get_reset_token(raw_token)
        if not token:
            raise ValidationError("Invalid or expired reset token")
        self.repository.update(token.user, {"password_hash": generate_password_hash(new_password)})
        self.repository.mark_token_used(token)
