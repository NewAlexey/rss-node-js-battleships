import { FrontUserModel } from "../../user/models/UserModel";

export type RoomModel = {
    id: number;
    socketIdList: number[];
};

export type FrontRoomModel = {
    roomId: number | string;
    roomUsers: FrontUserModel[];
};
