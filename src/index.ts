import { config } from "dotenv";

import { App } from "./app";
import { ControllerClassModel } from "./modules/ControllerModel";
import { UserController } from "./modules/user/user.controller";
import { RoomController } from "./modules/room/room.controller";
import { GameController } from "./modules/game/game.controller";
import { BotController } from "./modules/bot/bot.controller";
import { httpServer } from "./http_server";

config();

const port = process.env.PORT || 3000;

const controllerList: ControllerClassModel[] = [
    UserController,
    RoomController,
    GameController,
    BotController,
];

new App(port, controllerList);

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);
