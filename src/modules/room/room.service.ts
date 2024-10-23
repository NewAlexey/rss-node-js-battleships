import { BaseDataBase } from "../../db/base-db";
import { RoomModel } from "../../models/RoomModel";
import { RoomDb } from "../../db/room.db";
import { UserModel } from "../../models/UserModel";
import { UserDb } from "../../db/user.db";

export class RoomService {
    private readonly roomDb: BaseDataBase<RoomModel> = RoomDb;
    private readonly userDb: BaseDataBase<UserModel> = UserDb;

    public createRoom(socketId: number) {
        const room: Omit<RoomModel, "id"> = { socketIdList: [socketId] };

        return this.roomDb.add(room, socketId);
    }

    public getUser(userId: number): UserModel | undefined {
        return this.userDb.get(userId);
    }

    public getAllUsers(): UserModel[] {
        return this.userDb.getAll();
    }

    public addUserToRoom(socketId: number, roomId: number): RoomModel {
        const room = this.roomDb.get(roomId);

        if (!room) {
            throw new Error("Something wrong with roomId");
        }

        room.socketIdList.push(socketId);

        return room;
    }

    public getRoomList(): RoomModel[] {
        return this.roomDb.getAll();
    }
}
