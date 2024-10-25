import { config } from "dotenv";

import { App } from "./app";
import { ControllerClassModel } from "./modules/ControllerModel";
import { UserController } from "./modules/user/user.controller";
import { RoomController } from "./modules/room/room.controller";
import { GameController } from "./modules/game/game.controller";

config();

const port = process.env.PORT || 3000;

const controllerList: ControllerClassModel[] = [
    UserController,
    RoomController,
    GameController,
];

new App(port, controllerList);
