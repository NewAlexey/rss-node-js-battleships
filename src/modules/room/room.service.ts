import { BaseDataBase } from "../../db/base-db";
import { RoomDb } from "../../db/room.db";
import { UserDb } from "../../db/user.db";
import { UserModel } from "../user/models/UserModel";
import { emitDataHandler } from "../../utils/emitDataHandler";
import { FrontEventTypeModel } from "../../models/FrontEventTypeModel";

import { FrontRoomModel, RoomModel } from "./models/RoomModel";

export class RoomService {
    private readonly roomDb: BaseDataBase<RoomModel> = RoomDb;
    private readonly userDb: BaseDataBase<UserModel> = UserDb;

    public createRoom(socketId: number) {
        const room: Omit<RoomModel, "id"> = { socketIdList: [socketId] };

        return this.roomDb.add(room, socketId);
    }

    public getDataNotificatorList(): NotificationDataList[] {
        const roomList: RoomModel[] = this.getRoomList();
        const userList = this.getAllUsers();

        const userMap = userList.reduce<Record<number, UserModel>>(
            (acc, user) => {
                acc[user.id] = user;

                return acc;
            },
            {},
        );

        return userList.reduce<NotificationDataList[]>((acc, user) => {
            const availableRoomList = emitDataHandler<FrontRoomModel[]>(
                FrontEventTypeModel.ROOM_UPDATE,
                roomList.reduce<FrontRoomModel[]>((acc, room) => {
                    if (room.socketIdList.length === 2) {
                        return acc;
                    }

                    if (room.socketIdList.includes(user.id)) {
                        return acc;
                    }

                    const roomUser = userMap[room.socketIdList[0]];

                    if (!roomUser) {
                        return acc;
                    }

                    const frontRoom: FrontRoomModel = {
                        roomId: room.id,
                        roomUsers: [{ name: roomUser.name, id: roomUser.id }],
                    };

                    acc.push(frontRoom);

                    return acc;
                }, []),
            );

            const data: NotificationDataList = {
                userId: user.id,
                data: availableRoomList,
            };

            acc.push(data);

            return acc;
        }, []);
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

type NotificationDataList = { userId: number; data: string };
