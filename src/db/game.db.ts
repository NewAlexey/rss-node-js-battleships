import { GameModel } from "../modules/game/models/GameModel";

import { BaseDataBase } from "./base-db";

const GameDb = new BaseDataBase<GameModel>();

export { GameDb };
