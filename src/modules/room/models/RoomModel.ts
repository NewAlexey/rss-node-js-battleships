import { FrontUserModel } from "../../registration/models/UserModel";

export type RoomModel = {
    id: number;
    socketIdList: number[];
};

export type FrontRoomModel = {
    roomId: number | string;
    roomUsers: FrontUserModel[];
};
