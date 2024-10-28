import { config } from "dotenv";

import { App } from "./app";
import { ControllerClassModel } from "./modules/ControllerModel";
import { UserController } from "./modules/user/user.controller";
import { RoomController } from "./modules/room/room.controller";
import { GameController } from "./modules/game/game.controller";
import { BotController } from "./modules/bot/bot.controller";

config();

const port = process.env.PORT || 3000;

const controllerList: ControllerClassModel[] = [
    UserController,
    RoomController,
    GameController,
    BotController,
];

new App(port, controllerList);
