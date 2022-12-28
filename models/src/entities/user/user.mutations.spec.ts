import { UserEntity } from ".";

describe("User Mutations", () => {
  describe(UserEntity.mutations.createUser.name, () => {
    it.todo("should create a new user");
    it.todo("should prevent creating a new user with a duplicate username");
  });
  describe(UserEntity.mutations.updateUser.name, () => {
    it.todo("should change a user's properties");
    it.todo("should prevent changing a user that does not exist");
    it.todo("should prevent changing a user's title to a duplicate");
  });
});
