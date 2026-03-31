from werkzeug.security import generate_password_hash
from app.modules.users.repository import UserRepository
from app.errors.handlers import NotFoundError, ConflictError
from app.events.producer import publish


class UserService:
    def __init__(self, repository: UserRepository = None):
        self.repository = repository or UserRepository()

    def get_all(self):
        return self.repository.get_all()

    def get_by_id(self, id):
        user = self.repository.get_by_id(id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def create(self, email, name, password, role_id=None, employee_id=None):
        if self.repository.get_by_email(email):
            raise ConflictError("Email already registered")
        user = self.repository.create(
            email, name, generate_password_hash(password), role_id, employee_id
        )
        publish("user.created", {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.name if user.role else None,
            "employee_id": user.employee_id,
        })
        return user

    def assign_role(self, id, role_id):
        user = self.get_by_id(id)
        updated = self.repository.update(user, {"role_id": role_id})
        publish("user.updated", {
            "user_id": user.id,
            "email": user.email,
            "role": updated.role.name if updated.role else None,
        })
        return updated

    def deactivate(self, id):
        user = self.get_by_id(id)
        updated = self.repository.update(user, {"is_active": False})
        publish("user.deactivated", {"user_id": user.id, "email": user.email})
        return updated

    def reactivate(self, id):
        user = self.get_by_id(id)
        updated = self.repository.update(user, {"is_active": True})
        publish("user.reactivated", {"user_id": user.id, "email": user.email})
        return updated

    def reset_password(self, id, new_password):
        user = self.get_by_id(id)
        self.repository.update(user, {"password_hash": generate_password_hash(new_password)})
