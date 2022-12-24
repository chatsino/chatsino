import { UserEntity } from "./user.entity";

describe(UserEntity.name, () => {
  describe("Queries", () => {
    describe(UserEntity.queries.allUsers.name, () => {
      it("should return the set of all users", async () => {});
    });
    describe(UserEntity.queries.totalUsers.name, () => {
      it("should return the total number of users", async () => {});
    });
    describe(UserEntity.queries.userByUsername.name, () => {
      it("should return an existing user with the provided username", async () => {});
    });
    describe(UserEntity.queries.usersByUsernameList.name, () => {
      it("should return the set of users matching any of the provided usernames", async () => {});
    });
  });

  describe("Mutations", () => {
    describe(UserEntity.mutations.createUser.name, () => {
      it("should create a new user", async () => {});
      it("should prevent creating a new user with a duplicate username", async () => {});
    });
    describe(UserEntity.mutations.updateUser.name, () => {
      it("should change a user's properties", async () => {});
      it("should prevent changing a user that does not exist", async () => {});
      it("should prevent changing a user's title to a duplicate", async () => {});
    });
  });
});
