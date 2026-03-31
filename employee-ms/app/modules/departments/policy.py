from app.utils.policy import BasePolicy


class DepartmentPolicy(BasePolicy):
    def create(self):
        self.authorize("department.create")

    def update(self):
        self.authorize("department.update")

    def delete(self):
        self.authorize("department.delete")
