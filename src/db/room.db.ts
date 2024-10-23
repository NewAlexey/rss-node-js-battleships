import { RoomModel } from "../models/RoomModel";

import { BaseDataBase } from "./base-db";

const RoomDb = new BaseDataBase<RoomModel>();

export { RoomDb };
