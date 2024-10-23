import { ControllerModel, EventHandlerMapType } from "../ControllerModel";
import { EventEmitter } from "../../utils/EventEmitter";
import { EventTypeModel, ServerEventModel } from "../../models/EventTypeModel";
import { BaseMessageModel } from "../../models/BaseMessageModel";
import { FrontRoomModel, RoomModel } from "../../models/RoomModel";
import { emitDataHandler } from "../../utils/emitDataHandler";
import { UserModel } from "../../models/UserModel";

import { RoomService } from "./room.service";

export class RoomController implements ControllerModel {
    private readonly roomService: RoomService = new RoomService();
    private readonly eventEmitter: EventEmitter;

    private readonly eventHandlerMap: EventHandlerMapType = {
        [EventTypeModel.ROOM_CREATE]: (
            data: BaseMessageModel<any>,
            socketId: number,
        ) => this.createRoomHandler(socketId),
        [EventTypeModel.ROOM_ADD_USER]: (
            data: BaseMessageModel<AddUserToRoomType>,
            socketId: number,
        ) => this.addUserToRoomHandler(data, socketId),
    };

    constructor(eventEmitter: EventEmitter) {
        this.eventEmitter = eventEmitter;
        this.subscribeOnEvent();
    }

    public getEventHandlerMap(): EventHandlerMapType {
        return this.eventHandlerMap;
    }

    private subscribeOnEvent() {
        this.updateRoomHandler();
    }

    private addUserToRoomHandler(
        data: BaseMessageModel<AddUserToRoomType>,
        socketId: number,
    ): void {
        const gameRoom = this.roomService.addUserToRoom(
            socketId,
            data.data.indexRoom,
        );
        this.eventEmitter.emit(
            ServerEventModel.GAME_CREATE,
            gameRoom.socketIdList,
        );
    }

    private createRoomHandler(socketId: number) {
        const createdRoom = this.roomService.createRoom(socketId);

        const data = emitDataHandler(EventTypeModel.ROOM_CREATE, {
            indexRoom: createdRoom.id,
        });

        this.eventEmitter.emit(socketId, data);
        this.eventEmitter.emit(ServerEventModel.ROOM_LIST_UPDATE);
    }

    private updateRoomHandler() {
        this.eventEmitter.subscribe(ServerEventModel.ROOM_LIST_UPDATE, () => {
            const roomList: RoomModel[] = this.roomService.getRoomList();
            const userList = this.roomService.getAllUsers();

            const userMap = userList.reduce<Record<number, UserModel>>(
                (acc, user) => {
                    acc[user.id] = user;

                    return acc;
                },
                {},
            );

            userList.forEach((user) => {
                const data = emitDataHandler(
                    EventTypeModel.ROOM_UPDATE,
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
                            roomUsers: [
                                { name: roomUser.name, id: roomUser.id },
                            ],
                        };

                        acc.push(frontRoom);

                        return acc;
                    }, []),
                );
                this.eventEmitter.emit(user.id, data);
            });
        });
    }
}

type AddUserToRoomType = {
    indexRoom: number;
};
