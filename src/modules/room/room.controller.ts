import { ControllerModel, EventHandlerMapType } from "../ControllerModel";
import { EventEmitter } from "../../utils/EventEmitter";
import { EventTypeModel, InnerEventModel } from "../../models/EventTypeModel";
import { BaseMessageModel } from "../../models/BaseMessageModel";
import { FrontRoomModel, RoomModel } from "../../models/RoomModel";
import { emitDataHandler } from "../../utils/emitDataHandler";
import { FrontUserModel } from "../../models/UserModel";

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
        this.roomService.addUserToRoom(socketId, data.data.indexRoom);
        //TODO emit game_create
    }

    private createRoomHandler(socketId: number) {
        const createdRoom = this.roomService.createRoom(socketId);

        const data = emitDataHandler(EventTypeModel.ROOM_CREATE, {
            indexRoom: createdRoom.id,
        });

        this.eventEmitter.emit(socketId, data);
    }

    private updateRoomHandler() {
        this.eventEmitter.subscribe(
            InnerEventModel.USER_LOGIN,
            (socketId: number) => {
                const roomList: RoomModel[] = this.roomService.getRoomList();

                const data = emitDataHandler(
                    EventTypeModel.ROOM_UPDATE,
                    roomList.map<FrontRoomModel>((room) => ({
                        roomId: room.id,
                        roomUsers: room.socketIdList.map<FrontUserModel>(
                            (socketId) => {
                                const user = this.roomService.getUser(socketId);

                                if (!user) {
                                    throw new Error("Unknown user.");
                                }

                                return {
                                    name: user.name,
                                    id: user.id,
                                };
                            },
                        ),
                    })),
                );

                this.eventEmitter.emit(socketId, data);
            },
        );
    }
}

type AddUserToRoomType = {
    indexRoom: number;
};
