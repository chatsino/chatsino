import { RoomEntity } from "./room.entity";

describe(RoomEntity.name, () => {
  describe("Queries", () => {
    describe(RoomEntity.queries.allRooms.name, () => {
      it("should return the set of all rooms", async () => {});
    });
    describe(RoomEntity.queries.allPublicRooms.name, () => {
      it("should return the set of all publicly accessible rooms", async () => {});
    });
    describe(RoomEntity.queries.totalRooms.name, () => {
      it("should return the total number of rooms", async () => {});
    });
    describe(RoomEntity.queries.roomById.name, () => {
      it("should return a room with the specified ID", async () => {});
    });
    describe(RoomEntity.queries.roomByRoomTitle.name, () => {
      it("should return a room when the specified title has been used", async () => {});
    });
    describe(RoomEntity.queries.userPermissions.name, () => {
      it("should return a user's permissions in a given room", async () => {});
      it("should prevent retrieving user permissions from a room that does not exist", async () => {});
    });
    describe(RoomEntity.queries.meetsRoomPermissionRequirement.name, () => {
      it("should return true/false when the requirement is met/not met", async () => {});
      it("should prevent checking the requirement for a room that does not exist", async () => {});
    });
    describe(RoomEntity.queries.roomUsers.name, () => {
      it("should return a list of users that have joined a room", async () => {});
      it("should prevent retrieving a list for a room that does not exist", async () => {});
    });
    describe(RoomEntity.queries.roomMessages.name, () => {
      it("should return a list of messages that have been sent to a room", async () => {});
      it("should prevent retrieving a list for a room that does not exist", async () => {});
    });
  });

  describe("Mutations", () => {
    describe(RoomEntity.mutations.createRoom.name, () => {
      it("should create a room", async () => {});
      it("should prevent creating a room with a duplicate title", async () => {});
    });
    describe(RoomEntity.mutations.createDirectMessageRoom.name, () => {
      it("should create a private room", async () => {});
      it("should prevent creating a room when either provided user ID is invalid", async () => {});
      it("should prevent creating a room a private room between the two users already exists", async () => {});
    });
    describe(RoomEntity.mutations.updateRoom.name, () => {
      it("should change a message", async () => {});
      it("should prevent changing a message's title to a duplicate", async () => {});
    });
    describe(RoomEntity.mutations.joinRoom.name, () => {
      it("should add a user to a room", async () => {});
      it("should prevent adding a user to a room that does not exist", async () => {});
      it("should prevent adding user to a room that does not exist", async () => {});
      it("should prevent adding user to a room with the wrong password", async () => {});
      it("should prevent adding user to a room when blacklisted", async () => {});
      it("should prevent adding user to a room not on the whitelist", async () => {});
    });
    describe(RoomEntity.mutations.leaveRoom.name, () => {
      it("should remove a user from a room", async () => {});
    });
    describe(RoomEntity.mutations.modifyUserPermissions.name, () => {
      it("should change the permissions of a user in a room", async () => {});
      it("should prevent changing the permissions of a user in a room that does not exist", async () => {});
      it("should prevent a user from changing the permissions of another user when they are not the owner", async () => {});
    });
    describe(RoomEntity.mutations.sendMessage.name, () => {
      it("should create a message and add it to a room", async () => {});
      it("should prevent sending a message to a room that does not exist", async () => {});
      it("should prevent a muted user from sending a message to a room", async () => {});
      it("should prevent a user with the wrong password from sending a message to a room", async () => {});
      it("should prevent a blacklisted user from sending a message to a room", async () => {});
      it("should prevent a non-whitelisted user from sending a message to a room", async () => {});
    });
    describe(RoomEntity.mutations.sendDirectMessage.name, () => {
      it("should create a direct message and add it to a private room", async () => {});
      it("should create a new direct message room if this is the first message between two users", async () => {});
      it("should prevent sending a direct message if either specified user does not exist", async () => {});
    });
    describe(RoomEntity.mutations.pinMessage.name, () => {
      it("should add a message to the set of room pins", async () => {});
      it("should prevent adding a message to the set of room pins of a room that does not exist", async () => {});
      it("should prevent a user who is not a co-owner from pinning a message of a room", async () => {});
    });
    describe(RoomEntity.mutations.removeMessage.name, () => {
      it("should remove a message from a room without deleting when co-owner and not the author", async () => {});
      it("should remove a message from a room with deleting when author", async () => {});
      it("should prevent removing a message from a room that does not exist", async () => {});
      it("should prevent a user from removing a message if they are not allowed", async () => {});
    });
    describe(RoomEntity.mutations.removeUserMessages.name, () => {
      it("should remove all messages sent by a given user to a room", async () => {});
      it("should prevent removing messages from a room that does not exist", async () => {});
      it("should prevent removing messages from a room if not the owner", async () => {});
    });
  });
});
