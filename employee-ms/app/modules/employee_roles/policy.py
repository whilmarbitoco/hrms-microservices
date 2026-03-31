from app.utils.policy import BasePolicy


class EmployeeRolePolicy(BasePolicy):
    def create(self):
        self.authorize("employee_role.create")

    def update(self):
        self.authorize("employee_role.update")

    def delete(self):
        self.authorize("employee_role.delete")
