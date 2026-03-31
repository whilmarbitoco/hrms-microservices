from flask_jwt_extended import get_jwt
from app.utils.policy import BasePolicy
from app.errors.handlers import ForbiddenError


class EmployeePolicy(BasePolicy):
    def create(self):
        self.authorize("employee.create")

    def update(self):
        self.authorize("employee.update")

    def delete(self):
        self.authorize("employee.delete")

    def terminate(self):
        self.authorize("employee.terminate")

    def rehire(self):
        self.authorize("employee.rehire")

    def view(self, employee_id=None):
        self.authorize("employee.view")
        claims = get_jwt()
        if claims.get("role") == "employee" and employee_id:
            if claims.get("employee_id") != employee_id:
                raise ForbiddenError("You can only view your own record")
