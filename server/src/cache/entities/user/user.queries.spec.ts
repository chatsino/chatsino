import { UserEntity } from ".";

describe("User Queries", () => {
  describe(UserEntity.queries.allUsers.name, () => {
    it.todo("should return the set of all users");
  });
  describe(UserEntity.queries.totalUsers.name, () => {
    it.todo("should return the total number of users");
  });
  describe(UserEntity.queries.userByUsername.name, () => {
    it.todo("should return an existing user with the provided username");
  });
  describe(UserEntity.queries.usersByUsernameList.name, () => {
    it.todo(
      "should return the set of users matching any of the provided usernames"
    );
  });
});
