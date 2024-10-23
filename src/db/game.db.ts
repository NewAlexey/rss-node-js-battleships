import { GameModel } from "../models/GameModel";

import { BaseDataBase } from "./base-db";

const GameDb = new BaseDataBase<GameModel>();

export { GameDb };
